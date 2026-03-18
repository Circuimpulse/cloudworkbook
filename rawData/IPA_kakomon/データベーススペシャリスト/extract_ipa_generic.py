# -*- coding: utf-8 -*-
"""
IPA 高度情報処理試験 午後問題PDF → Markdown + 画像 抽出スクリプト（汎用版）

使い方:
  python extract_ipa_generic.py

各フォルダに配置して実行すると、同フォルダ内のPDFを自動検出し、
年度・季節ごとのサブフォルダに問題/解答/採点基準のMarkdownと図表画像を出力します。

ファイル命名パターン:
  YYYY_SEASON_XX_SESSION_mondai.pdf  → 問題.md + 図表画像
  YYYY_SEASON_XX_SESSION_kaitou.pdf  → 解答.md
  YYYY_SEASON_XX_SESSION_saiten.pdf  → 採点基準.md

出力例:
  2024_aki/
    pm1_問題.md
    pm1_解答.md
    pm1_採点基準.md
    pm1_extractions.json
    pm1_問X_figY.png
    pm2_問題.md
    pm2_解答.md
    ...
"""

from google import genai
from google.genai import types
from typing import List, Literal
from pydantic import BaseModel, Field
import fitz  # PyMuPDF
import json
import os
import re
import time
import glob
import traceback
from collections import defaultdict

# ============================================================
# 設定
# ============================================================
API_KEY = os.environ.get("GEMINI_API_KEY", "")
INPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_NAMES = ["gemini-2.5-flash", "gemini-2.0-flash"]
MODEL_NAME = MODEL_NAMES[0]
MAX_RPD = 10000
RPD_COUNTER_FILE = os.path.join(INPUT_DIR, "rpd_counter.json")

# ============================================================
# プロンプト（午後 記述式問題用）
# ============================================================
PROMPT_MONDAI = """
あなたは高度な文書解析の専門AIです。添付されたPDF（情報処理技術者試験の午後問題）を解析し、以下の指示に従って「1. 図表のJSONリスト」および「2. 問題内容のMarkdownテキスト」を出力してください。

### 1. 処理の基本ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- **読解順序**: 問題の自然な順序でテキストを抽出してください。2段組の場合は左カラムを上から下まで読んでから右カラムに移ってください。
- **欠落の禁止**: いかなる問題文、設問、条件文、注記も省略したり要約したりせず、全文を抽出してください。
- **除外事項**: ページ番号、ヘッダー（試験名称のリピート等）、フッターの抽出は不要です。
- **JSON優先の原則**: 本文（Markdown）内に挿入する画像リンクは、必ずJSONリストに存在する filename のみを使用してください。

### 2. 図と表の抽出リスト (JSON形式)
- 問題文中に含まれるすべての「図」「表」「グラフ」「フローチャート」「ネットワーク構成図」「状態遷移図」「E-R図」「UMLダイアグラム」「シーケンス図」「クラス図」「画像として表現された数式や図形」等を特定してください。
- ただし、テキストとして十分に表現できる簡単な表や箇条書きは、図表として抽出せずMarkdownの表として記述してください。
- 各図表について、切り出すための座標（Bounding Box）を特定してください。
- 座標はPDFのページサイズに対する相対値として **0から1000の範囲（正規化座標）** で `[ymin, xmin, ymax, xmax]` の順に出力してください。
- `page_number` は 1 から始まるページ番号です。
- `question_number` は図表が含まれる問題の番号です（問1なら1）。設問に属さない場合は0としてください。
- `filename` は「図X_Y.png」（Xは問題番号、Yは連番）で命名してください。問題全体の図表の場合は「図0_Y.png」としてください。

### 3. ドキュメント内容 (Markdown形式)
- 問題文をMarkdown形式で出力してください。
- 大問は `# 問X` の見出し（H1）で始めてください。
- 設問は `## 設問X` の見出し（H2）で、小問は適宜 `### ` (H3) を使ってください。
- 問題文は原文をそのまま正確に記述してください。穴埋め問題の空欄（ア、イ、ウ…や[ a ]、[ b ]等）もそのまま記載してください。
- 図表がある位置には、対応する画像リンク `![図表の説明](図X_Y.png)` を挿入してください。
- 段落の区切りには必ず空行を1行入れてください。
- 数式がある場合はTeX形式で $...$ または $$...$$ を使って表現してください。
- 長い問題文の構造（条件、前提、資料など）を見出しや箇条書きで整理し、見やすくしてください。
"""

# ============================================================
# プロンプト（解答用）
# ============================================================
PROMPT_KAITOU = """
あなたは高度な文書解析の専門AIです。添付されたPDF（情報処理技術者試験の午後問題 解答例）を解析し、以下の指示に従って出力してください。

### 処理ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- 解答例のすべての内容を漏れなく抽出してください。
- 設問番号と解答を対応付けて出力してください。

### 出力形式
- 図表の抽出リスト (extractions) は空リストにしてください。
- Markdown形式で出力してください。
- 大問は `# 問X` の見出し（H1）で始め、設問ごとに解答を記載してください。
- 図表が解答に含まれる場合は、テキストで可能な限り表現してください。
"""

# ============================================================
# プロンプト（採点基準用）
# ============================================================
PROMPT_SAITEN = """
あなたは高度な文書解析の専門AIです。添付されたPDF（情報処理技術者試験の午後問題 採点講評/出題趣旨）を解析し、以下の指示に従って出力してください。

### 処理ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- すべての内容を漏れなく抽出してください。

### 出力形式
- 図表の抽出リスト (extractions) は空リストにしてください。
- Markdown形式で出力してください。
- 大問ごとに見出しを付けてください。
"""

# ============================================================
# Pydantic モデル
# ============================================================
class FigureTableItem(BaseModel):
    """問題中の図表情報"""
    question_number: int = Field(description="図表が含まれる問題の番号（問1なら1、全体なら0）")
    filename: str = Field(description="保存する際のファイル名（例: 図1_1.png）")
    page_number: int = Field(description="1から始まるページ番号")
    box_2d: List[int] = Field(
        description="[ymin, xmin, ymax, xmax] の順で、0-1000の範囲で正規化された座標",
        min_length=4,
        max_length=4
    )
    type: Literal["figure", "table"] = Field(description="図(figure)か表(table)かの種別")
    caption: str = Field(description="図表の簡単な説明")


class DocumentExtractionResponse(BaseModel):
    """Geminiからの最終レスポンス形式"""
    extractions: List[FigureTableItem] = Field(description="抽出された図表のリスト（図表がない場合は空リスト）")
    content_markdown: str = Field(description="Markdown形式の全文")


# ============================================================
# 画像抽出関数
# ============================================================
def crop_images_from_pdf(pdf_path, extractions, output_dir, prefix="", padding_ratio=0.05):
    """PDFから図表を切り出して画像として保存"""
    if not extractions:
        print("  → 図表なし（画像抽出スキップ）")
        return

    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)

    for item in extractions:
        try:
            page_num = item.page_number - 1
            if page_num < 0 or page_num >= len(doc):
                print(f"  ⚠ ページ番号 {item.page_number} が範囲外です: {item.filename}")
                continue

            ymin, xmin, ymax, xmax = item.box_2d
            width = xmax - xmin
            height = ymax - ymin
            xmin_new = max(0, xmin - (width * padding_ratio))
            xmax_new = min(1000, xmax + (width * padding_ratio))
            ymin_new = max(0, ymin - (height * padding_ratio))
            ymax_new = min(1000, ymax + (height * padding_ratio))

            page = doc.load_page(page_num)
            p_width = page.rect.width
            p_height = page.rect.height

            left = (xmin_new / 1000) * p_width
            top = (ymin_new / 1000) * p_height
            right = (xmax_new / 1000) * p_width
            bottom = (ymax_new / 1000) * p_height

            rect = fitz.Rect(left, top, right, bottom)
            zoom = 3.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, clip=rect)

            # prefixを付けてファイル名を生成
            output_filename = f"{prefix}{item.filename}" if prefix else item.filename
            output_path = os.path.join(output_dir, output_filename)
            pix.save(output_path)
            print(f"  → 画像保存: {output_filename}")

        except Exception as e:
            print(f"  ⚠ 画像抽出エラー ({item.filename}): {e}")

    doc.close()


# ============================================================
# PDF処理関数
# ============================================================
def process_pdf(client, pdf_path, output_folder, output_md_name, prompt, 
                extract_images=True, image_prefix="", max_retries=5):
    """1つのPDFを処理してMarkdownと画像を出力"""
    pdf_name = os.path.basename(pdf_path)
    print(f"\n{'='*60}")
    print(f"処理中: {pdf_name}")
    print(f"出力先: {output_folder}/{output_md_name}")
    print(f"{'='*60}")

    print("  PDFアップロード中...")
    file_upload = client.files.upload(file=pdf_path)

    response = None
    current_model = MODEL_NAME
    for attempt in range(max_retries):
        try:
            print(f"  Gemini APIで解析中 [{current_model}]..." + (f"（リトライ {attempt+1}/{max_retries}）" if attempt > 0 else ""))
            response = client.models.generate_content(
                model=current_model,
                contents=[
                    types.Content(
                        parts=[
                            types.Part(prompt),
                            types.Part(file_upload)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DocumentExtractionResponse
                )
            )
            # partsが空の場合もリトライ（次のモデルに切り替え）
            if not response.parts:
                # 別モデルに切り替えを試みる
                model_idx = MODEL_NAMES.index(current_model) if current_model in MODEL_NAMES else -1
                if model_idx < len(MODEL_NAMES) - 1:
                    current_model = MODEL_NAMES[model_idx + 1]
                    print(f"  ⚠ partsが空。モデルを {current_model} に切り替えてリトライ... ({attempt+1}/{max_retries})")
                else:
                    print(f"  ⚠ partsが空。リトライします... ({attempt+1}/{max_retries})")
                wait_time = 15 * (2 ** attempt)
                time.sleep(wait_time)
                response = None
                continue
            break
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait_time = 60 * (2 ** attempt)
                print(f"  ⚠ レート制限（429）。{wait_time}秒待機してリトライします...")
                time.sleep(wait_time)
            elif "500" in error_str or "INTERNAL" in error_str:
                wait_time = 30 * (2 ** attempt)
                print(f"  ⚠ サーバーエラー（500）。{wait_time}秒待機してリトライします... ({attempt+1}/{max_retries})")
                time.sleep(wait_time)
            elif "404" in error_str or "NOT_FOUND" in error_str:
                # モデルが見つからない場合、フォールバック
                model_idx = MODEL_NAMES.index(current_model) if current_model in MODEL_NAMES else -1
                if model_idx < len(MODEL_NAMES) - 1:
                    current_model = MODEL_NAMES[model_idx + 1]
                    print(f"  ⚠ モデル404。{current_model} にフォールバック...")
                else:
                    print(f"  ⚠ 全モデル404。スキップします...")
                    raise
            else:
                raise

    if response is None:
        print(f"  ✗ エラー: {max_retries}回リトライしましたが失敗しました")
        return None

    result = None
    for part in response.parts:
        if not part.text:
            continue
        if hasattr(part, 'thought') and part.thought:
            continue
        result = json.loads(part.text)
        break

    if result is None:
        print(f"  ✗ エラー: レスポンスが取得できませんでした")
        return None

    extraction_data = DocumentExtractionResponse(**result)
    os.makedirs(output_folder, exist_ok=True)

    # Markdown保存
    md_path = os.path.join(output_folder, output_md_name)
    md_content = extraction_data.content_markdown.replace('\\n', '\n')
    with open(md_path, "w", encoding="utf-8", newline='\n') as f:
        f.write(md_content)
    print(f"  → Markdown保存: {output_md_name}")

    # JSON・画像保存
    if extract_images and extraction_data.extractions:
        json_name = output_md_name.replace("問題.md", "extractions.json")
        json_path = os.path.join(output_folder, json_name)
        extraction_list = [item.model_dump() for item in extraction_data.extractions]
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(extraction_list, f, ensure_ascii=False, indent=2)
        print(f"  → JSON保存: {json_name}（図表{len(extraction_list)}件）")
        crop_images_from_pdf(pdf_path, extraction_data.extractions, output_folder, prefix=image_prefix)

    usage = response.usage_metadata
    print(f"  トークン使用量: prompt={usage.prompt_token_count}, "
          f"output={usage.candidates_token_count}, "
          f"total={usage.total_token_count}")

    return extraction_data


# ============================================================
# ファイルグループ検出
# ============================================================
def find_pdf_groups(input_dir):
    """
    PDFファイルを年度・季節・セッションごとにグループ化する
    
    ファイル名パターン: YYYY_SEASON_XX_SESSION_TYPE.pdf
    例: 2024_aki_DB_pm1_mondai.pdf
        2024_haru_SC_gogo_mondai.pdf
        2024_aki_AP_gogo_mondai.pdf

    Returns:
        dict: { "2024_aki": { "pm1": {"mondai": path, "kaitou": path, "saiten": path},
                              "pm2": {...} } }
    """
    all_pdfs = sorted(glob.glob(os.path.join(input_dir, "*.pdf")))
    
    groups = defaultdict(lambda: defaultdict(dict))
    
    for pdf_path in all_pdfs:
        basename = os.path.splitext(os.path.basename(pdf_path))[0]
        # 例: "2024_aki_DB_pm1_mondai" or "2024_haru_SC_gogo_mondai"
        
        # タイプ（末尾）を識別
        pdf_type = None
        for t in ["mondai", "kaitou", "saiten"]:
            if basename.endswith(f"_{t}"):
                pdf_type = t
                break
        
        if pdf_type is None:
            print(f"  ⚠ 不明なファイルタイプ: {basename}")
            continue
        
        # タイプを除いた部分: "2024_aki_DB_pm1"
        name_without_type = basename[:-(len(pdf_type) + 1)]
        
        # パターン: YYYY_SEASON_XX_SESSION
        # YYYYとSEASONを抽出（先頭2パーツ）
        parts = name_without_type.split("_")
        if len(parts) < 4:
            print(f"  ⚠ パース不能: {basename}")
            continue
        
        year_season = f"{parts[0]}_{parts[1]}"  # "2024_aki"
        session = parts[-1]  # "pm1", "pm2", "gogo", "am2" etc.
        
        groups[year_season][session][pdf_type] = pdf_path
    
    # dictに変換してソート
    sorted_groups = {}
    for ys in sorted(groups.keys()):
        sorted_groups[ys] = dict(sorted(groups[ys].items()))
    
    return sorted_groups


# ============================================================
# メイン
# ============================================================
def main():
    folder_name = os.path.basename(INPUT_DIR)
    print("=" * 60)
    print(f"IPA試験 PDF → Markdown + 画像 抽出")
    print(f"対象: {folder_name}")
    print("=" * 60)

    client = genai.Client(api_key=API_KEY)

    # PDFグループ検出
    groups = find_pdf_groups(INPUT_DIR)
    
    # 表示
    total_api_calls = 0
    print(f"\n検出された年度・季節: {len(groups)}組")
    for ys, sessions in groups.items():
        session_list = []
        for sess, types_dict in sessions.items():
            type_marks = []
            for t in ["mondai", "kaitou", "saiten"]:
                type_marks.append("✓" if t in types_dict else "✗")
            session_list.append(f"{sess}(問:{type_marks[0]} 答:{type_marks[1]} 採:{type_marks[2]})")
            total_api_calls += len(types_dict)
        print(f"  - {ys}: {', '.join(session_list)}")

    print(f"\n合計APIコール数（予定）: {total_api_calls}")
    print(f"モデル: {MODEL_NAME}")
    print(f"1日あたり最大リクエスト数: {MAX_RPD}\n")

    # RPDカウンター
    today_str = time.strftime("%Y-%m-%d")
    rpd_count = 0
    if os.path.exists(RPD_COUNTER_FILE):
        with open(RPD_COUNTER_FILE, "r", encoding="utf-8") as f:
            counter_data = json.load(f)
            if counter_data.get("date") == today_str:
                rpd_count = counter_data.get("count", 0)
    print(f"本日のリクエスト済み回数: {rpd_count}/{MAX_RPD}\n")

    # 処理
    success_count = 0
    error_count = 0
    call_index = 0

    type_config = {
        "mondai": {"md_name": "問題.md", "prompt": PROMPT_MONDAI, "extract_images": True},
        "kaitou": {"md_name": "解答.md", "prompt": PROMPT_KAITOU, "extract_images": False},
        "saiten": {"md_name": "採点基準.md", "prompt": PROMPT_SAITEN, "extract_images": False},
    }

    for ys, sessions in groups.items():
        output_folder = os.path.join(INPUT_DIR, ys)

        for session, types_dict in sessions.items():
            # セッションプレフィックス (pm1_, pm2_, gogo_ など)
            prefix = f"{session}_"
            
            for pdf_type in ["mondai", "kaitou", "saiten"]:
                if pdf_type not in types_dict:
                    continue
                
                call_index += 1
                config = type_config[pdf_type]
                md_filename = f"{prefix}{config['md_name']}"
                
                md_path = os.path.join(output_folder, md_filename)
                if os.path.exists(md_path):
                    print(f"\n  ⏭ スキップ（処理済み）: {ys}/{md_filename} ({call_index}/{total_api_calls})")
                    continue

                if rpd_count >= MAX_RPD:
                    print(f"\n  ⛔ 本日のリクエスト上限（{MAX_RPD}回）に達しました。")
                    print(f"  明日再度実行してください。処理済みファイルは自動スキップされます。")
                    # サマリー表示後終了
                    print(f"\n{'='*60}")
                    print(f"中断！")
                    print(f"  成功: {success_count}, 失敗: {error_count}")
                    print(f"  本日リクエスト数: {rpd_count}/{MAX_RPD}")
                    print(f"{'='*60}")
                    return

                try:
                    result = process_pdf(
                        client,
                        types_dict[pdf_type],
                        output_folder,
                        output_md_name=md_filename,
                        prompt=config["prompt"],
                        extract_images=config["extract_images"],
                        image_prefix=prefix if config["extract_images"] else ""
                    )
                    if result is not None:
                        success_count += 1
                        rpd_count += 1
                        with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                            json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                        print(f"  ✓ 完了 ({call_index}/{total_api_calls}) [本日リクエスト: {rpd_count}/{MAX_RPD}]")
                    else:
                        error_count += 1
                        print(f"  ✗ 失敗 ({call_index}/{total_api_calls})")
                except Exception as e:
                    error_count += 1
                    print(f"  ✗ エラー ({call_index}/{total_api_calls}): {e}")
                    traceback.print_exc()

                # API制限回避
                if call_index < total_api_calls:
                    print("  ⏳ 5秒待機中...")
                    time.sleep(5)

    # サマリー
    print(f"\n{'='*60}")
    print(f"全処理完了！")
    print(f"  成功: {success_count}")
    print(f"  失敗: {error_count}")
    print(f"  本日リクエスト数: {rpd_count}/{MAX_RPD}")
    print(f"  出力先: 各年度フォルダ（{INPUT_DIR} 内）")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

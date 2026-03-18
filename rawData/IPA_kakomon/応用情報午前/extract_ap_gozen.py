# -*- coding: utf-8 -*-
"""
応用情報技術者試験 午前問題PDF → Markdown + 画像 抽出スクリプト

使い方:
  python extract_ap_gozen.py

入力:
  同フォルダ内の *_AP_gozen_mondai.pdf と *_AP_gozen_kaitou.pdf

出力:
  (同フォルダ)/
    2024_aki/
      問題.md
      解答.md
      extractions.json
      問題XX.png  (図表がある問題のみ)
    2024_haru/
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

# ============================================================
# 設定
# ============================================================
API_KEY = os.environ.get("GEMINI_API_KEY", "")
INPUT_DIR = os.path.dirname(os.path.abspath(__file__))  # スクリプトと同じフォルダ
MODEL_NAME = "gemini-2.5-flash"
MAX_RPD = 10000  # 1日あたりの最大リクエスト数
RPD_COUNTER_FILE = os.path.join(INPUT_DIR, "rpd_counter.json")

# ============================================================
# プロンプト（問題用）
# ============================================================
PROMPT_MONDAI = """
あなたは高度な文書解析の専門AIです。添付されたPDF（応用情報技術者試験の午前問題）を解析し、以下の指示に従って「1. 図表のJSONリスト」および「2. 問題内容のMarkdownテキスト」を出力してください。

### 1. 処理の基本ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- **読解順序**: 問題番号順（問1〜問80）にテキストを抽出してください。2段組の場合は左カラムを上から下まで読んでから右カラムに移ってください。
- **欠落の禁止**: いかなる問題、選択肢も省略したり要約したりせず、全文を抽出してください。
- **除外事項**: ページ番号、ヘッダー（試験名称のリピート等）、フッターの抽出は不要です。
- **JSON優先の原則**: 本文（Markdown）内に挿入する画像リンクは、必ずJSONリストに存在する filename のみを使用してください。

### 2. 図と表の抽出リスト (JSON形式)
- 問題文や選択肢中に含まれるすべての「図」「表」「グラフ」「イラスト」「画像として表現された数式や図形」「フローチャート」「ネットワーク構成図」「状態遷移図」「E-R図」「UMLダイアグラム」等を特定してください。
- ただし、テキストとして十分に表現できる簡単な表や箇条書きは、図表として抽出せずMarkdownの表として記述してください。
- 各図表について、切り出すための座標（Bounding Box）を特定してください。
- 座標はPDFのページサイズに対する相対値として **0から1000の範囲（正規化座標）** で `[ymin, xmin, ymax, xmax]` の順に出力してください。
- `page_number` は 1 から始まるページ番号です。
- `question_number` は図表が含まれる問題の番号です（例：問15なら15）。
- `filename` は「問題XX.png」（XXは問題番号、ゼロ埋めなし）で命名してください。同じ問題に複数の図表がある場合は「問題XX_1.png」「問題XX_2.png」のように連番をつけてください。

### 3. ドキュメント内容 (Markdown形式)
- 問題文と選択肢をMarkdown形式で出力してください。
- 各問題は `## 問X` の見出し（H2）で始めてください（Xは問題番号、ゼロ埋めなし）。
- 問題文はそのまま正確に記述してください。
- 選択肢はア、イ、ウ、エの形式で記述してください。（原文の表記をそのまま維持）
- 図表がある位置には、対応する画像リンク `![図表の説明](問題XX.png)` を挿入してください。
- 段落の区切りには必ず空行を1行入れてください。
- Markdownの見出し、箇条書き、太字を適切に使用し、見やすくしてください。
- 数式がある場合はTeX形式で $...$ または $$...$$ を使って表現してください。
"""

# ============================================================
# プロンプト（解答用）
# ============================================================
PROMPT_KAITOU = """
あなたは高度な文書解析の専門AIです。添付されたPDF（応用情報技術者試験の午前問題 解答一覧）を解析し、以下の指示に従って出力してください。

### 処理ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- 解答表のすべての問題番号と正解を抽出してください。
- 欠落は禁止です。すべての問題の解答を抽出してください。

### 出力形式
- 図表の抽出リスト (extractions) は空リストにしてください（解答表には通常、図表はありません）。
- Markdown形式で、以下のフォーマットで出力してください:

```
# 解答一覧

| 問題番号 | 正解 |
|---------|------|
| 問1 | ア |
| 問2 | イ |
...
```

- すべての問題（通常80問）の解答を漏れなく記載してください。
"""

# ============================================================
# Pydantic モデル（構造化出力用）
# ============================================================
class FigureTableItem(BaseModel):
    """問題中の図表情報"""
    question_number: int = Field(description="図表が含まれる問題の番号（例：問15なら15）")
    filename: str = Field(description="保存する際のファイル名（例: 問題15.png）")
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
    content_markdown: str = Field(description="Markdown形式の全問題文または解答一覧")


# ============================================================
# 画像抽出関数
# ============================================================
def crop_images_from_pdf(pdf_path, extractions, output_dir, padding_ratio=0.05):
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

            # 範囲を少し広げる（パディング）
            width = xmax - xmin
            height = ymax - ymin
            xmin_new = max(0, xmin - (width * padding_ratio))
            xmax_new = min(1000, xmax + (width * padding_ratio))
            ymin_new = max(0, ymin - (height * padding_ratio))
            ymax_new = min(1000, ymax + (height * padding_ratio))

            # PDFの実座標に変換
            page = doc.load_page(page_num)
            p_width = page.rect.width
            p_height = page.rect.height

            left = (xmin_new / 1000) * p_width
            top = (ymin_new / 1000) * p_height
            right = (xmax_new / 1000) * p_width
            bottom = (ymax_new / 1000) * p_height

            rect = fitz.Rect(left, top, right, bottom)

            # 高画質で保存
            zoom = 3.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, clip=rect)

            output_path = os.path.join(output_dir, item.filename)
            pix.save(output_path)
            print(f"  → 画像保存: {item.filename}")

        except Exception as e:
            print(f"  ⚠ 画像抽出エラー ({item.filename}): {e}")

    doc.close()


# ============================================================
# PDF処理関数
# ============================================================
def process_pdf(client, pdf_path, output_folder, output_md_name, prompt, extract_images=True, max_retries=5):
    """1つのPDFを処理してMarkdownと画像を出力（リトライ付き）"""
    pdf_name = os.path.basename(pdf_path)
    print(f"\n{'='*60}")
    print(f"処理中: {pdf_name}")
    print(f"出力先: {output_folder}/{output_md_name}")
    print(f"{'='*60}")

    # PDFをGemini APIにアップロード
    print("  PDFアップロード中...")
    file_upload = client.files.upload(file=pdf_path)

    # Gemini APIで解析（リトライ付き）
    response = None
    for attempt in range(max_retries):
        try:
            print(f"  Gemini APIで解析中 [{MODEL_NAME}]..." + (f"（リトライ {attempt+1}/{max_retries}）" if attempt > 0 else ""))
            response = client.models.generate_content(
                model=MODEL_NAME,
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
            # partsが空の場合もリトライ
            if not response.parts:
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
            else:
                raise

    if response is None:
        print(f"  ✗ エラー: {max_retries}回リトライしましたが失敗しました")
        return None

    # レスポンス解析
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

    # 出力フォルダ作成
    os.makedirs(output_folder, exist_ok=True)

    # Markdown保存
    md_path = os.path.join(output_folder, output_md_name)
    md_content = extraction_data.content_markdown.replace('\\n', '\n')
    with open(md_path, "w", encoding="utf-8", newline='\n') as f:
        f.write(md_content)
    print(f"  → Markdown保存: {output_md_name}")

    # JSON保存（問題ファイルのみ、図表情報がある場合）
    if extract_images and extraction_data.extractions:
        json_path = os.path.join(output_folder, "extractions.json")
        extraction_list = [item.model_dump() for item in extraction_data.extractions]
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(extraction_list, f, ensure_ascii=False, indent=2)
        print(f"  → JSON保存: extractions.json（図表{len(extraction_list)}件）")

        # 画像抽出
        crop_images_from_pdf(pdf_path, extraction_data.extractions, output_folder)

    # トークン使用量表示
    usage = response.usage_metadata
    print(f"  トークン使用量: prompt={usage.prompt_token_count}, "
          f"output={usage.candidates_token_count}, "
          f"total={usage.total_token_count}")

    return extraction_data


# ============================================================
# ファイルペア検出
# ============================================================
def find_pdf_pairs(input_dir):
    """
    応用情報午前のPDFファイルを年度・季節ごとにペアにする
    
    ファイル名パターン: YYYY_SEASON_AP_gozen_mondai.pdf / _kaitou.pdf
    例: 2024_aki_AP_gozen_mondai.pdf
    
    Returns:
        list of dict: [{"folder": "2024_aki", "mondai": path, "kaitou": path}, ...]
    """
    mondai_files = sorted(glob.glob(os.path.join(input_dir, "*_AP_gozen_mondai.pdf")))
    kaitou_files = sorted(glob.glob(os.path.join(input_dir, "*_AP_gozen_kaitou.pdf")))

    # kaitouファイルをフォルダ名でインデックス
    kaitou_map = {}
    for kf in kaitou_files:
        basename = os.path.basename(kf)
        # "2024_aki_AP_gozen_kaitou.pdf" → "2024_aki"
        parts = basename.replace("_AP_gozen_kaitou.pdf", "")
        kaitou_map[parts] = kf

    pairs = []
    for mf in mondai_files:
        basename = os.path.basename(mf)
        # "2024_aki_AP_gozen_mondai.pdf" → "2024_aki"
        folder_name = basename.replace("_AP_gozen_mondai.pdf", "")
        
        pair = {
            "folder": folder_name,
            "mondai": mf,
            "kaitou": kaitou_map.get(folder_name)
        }
        pairs.append(pair)

    return pairs


# ============================================================
# メイン
# ============================================================
def main():
    print("=" * 60)
    print("応用情報技術者試験 午前問題PDF → Markdown + 画像 抽出")
    print("=" * 60)

    # Gemini Client初期化
    client = genai.Client(api_key=API_KEY)

    # PDFファイルペア検出
    pairs = find_pdf_pairs(INPUT_DIR)
    print(f"\n検出された年度・季節: {len(pairs)}組")
    for p in pairs:
        kaitou_status = "✓" if p["kaitou"] else "✗"
        print(f"  - {p['folder']}  (問題: ✓, 解答: {kaitou_status})")

    # 総処理ファイル数（mondai + kaitou）
    total_api_calls = sum(1 + (1 if p["kaitou"] else 0) for p in pairs)
    print(f"\n合計APIコール数（予定）: {total_api_calls}")
    print(f"モデル: {MODEL_NAME}")
    print(f"1日あたり最大リクエスト数: {MAX_RPD}\n")

    # RPDカウンター読み込み
    today_str = time.strftime("%Y-%m-%d")
    rpd_count = 0
    if os.path.exists(RPD_COUNTER_FILE):
        with open(RPD_COUNTER_FILE, "r", encoding="utf-8") as f:
            counter_data = json.load(f)
            if counter_data.get("date") == today_str:
                rpd_count = counter_data.get("count", 0)
    print(f"本日のリクエスト済み回数: {rpd_count}/{MAX_RPD}\n")

    # 各ペアを処理
    success_count = 0
    error_count = 0
    call_index = 0

    for pair in pairs:
        folder_name = pair["folder"]
        output_folder = os.path.join(INPUT_DIR, folder_name)

        # ---- 問題PDF処理 ----
        call_index += 1
        mondai_md = os.path.join(output_folder, "問題.md")
        if os.path.exists(mondai_md):
            print(f"\n  ⏭ スキップ（処理済み）: {folder_name}/問題.md ({call_index}/{total_api_calls})")
        else:
            if rpd_count >= MAX_RPD:
                print(f"\n  ⛔ 本日のリクエスト上限（{MAX_RPD}回）に達しました。")
                print(f"  明日再度実行してください。処理済みフォルダは自動スキップされます。")
                break

            try:
                result = process_pdf(
                    client, pair["mondai"], output_folder,
                    output_md_name="問題.md",
                    prompt=PROMPT_MONDAI,
                    extract_images=True
                )
                if result is not None:
                    success_count += 1
                    rpd_count += 1
                    with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                        json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                    print(f"  ✓ 問題完了 ({call_index}/{total_api_calls}) [本日リクエスト: {rpd_count}/{MAX_RPD}]")
                else:
                    error_count += 1
                    print(f"  ✗ 問題失敗 ({call_index}/{total_api_calls})")
            except Exception as e:
                error_count += 1
                print(f"  ✗ エラー ({call_index}/{total_api_calls}): {e}")
                traceback.print_exc()

            # API制限回避
            print("  ⏳ 5秒待機中...")
            time.sleep(5)

        # ---- 解答PDF処理 ----
        if pair["kaitou"]:
            call_index += 1
            kaitou_md = os.path.join(output_folder, "解答.md")
            if os.path.exists(kaitou_md):
                print(f"  ⏭ スキップ（処理済み）: {folder_name}/解答.md ({call_index}/{total_api_calls})")
            else:
                if rpd_count >= MAX_RPD:
                    print(f"\n  ⛔ 本日のリクエスト上限（{MAX_RPD}回）に達しました。")
                    break

                try:
                    result = process_pdf(
                        client, pair["kaitou"], output_folder,
                        output_md_name="解答.md",
                        prompt=PROMPT_KAITOU,
                        extract_images=False  # 解答表には画像不要
                    )
                    if result is not None:
                        success_count += 1
                        rpd_count += 1
                        with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                            json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                        print(f"  ✓ 解答完了 ({call_index}/{total_api_calls}) [本日リクエスト: {rpd_count}/{MAX_RPD}]")
                    else:
                        error_count += 1
                        print(f"  ✗ 解答失敗 ({call_index}/{total_api_calls})")
                except Exception as e:
                    error_count += 1
                    print(f"  ✗ エラー ({call_index}/{total_api_calls}): {e}")
                    traceback.print_exc()

                # API制限回避（最後のペア以外）
                if pair != pairs[-1]:
                    print("  ⏳ 5秒待機中...")
                    time.sleep(5)

    # 結果サマリー
    print(f"\n{'='*60}")
    print(f"全処理完了！")
    print(f"  成功: {success_count}")
    print(f"  失敗: {error_count}")
    print(f"  本日リクエスト数: {rpd_count}/{MAX_RPD}")
    print(f"  出力先: 各年度フォルダ（{INPUT_DIR} 内）")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

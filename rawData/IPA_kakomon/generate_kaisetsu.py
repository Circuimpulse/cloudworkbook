# -*- coding: utf-8 -*-
"""
IPA 高度情報処理試験 解説生成スクリプト

問題PDF + 解答PDF + 採点基準PDFを直接Geminiに送信し、
画像を含む内容も読み取った上で詳細な解説を生成します。

使い方:
  python generate_kaisetsu.py

各フォルダに配置して実行すると、同フォルダ内のPDFを自動検出し、
年度・季節ごとのサブフォルダに解説Markdownを出力します。

出力例:
  2024_aki/
    pm1_解説.md
    pm2_解説.md
"""

from google import genai
from google.genai import types
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
MODEL_NAME = "gemini-2.5-flash"
MAX_RPD = 10000
RPD_COUNTER_FILE = os.path.join(INPUT_DIR, "rpd_counter.json")

# ============================================================
# 解説生成プロンプト
# ============================================================
PROMPT_KAISETSU = """
あなたは情報処理技術者試験の専門講師AIです。添付された3つのPDF（問題、解答例、採点講評/出題趣旨）を全て読み取り、以下の指示に従って**詳細な解説**を生成してください。

## 入力PDF
1. **問題PDF**: 試験問題の全文（図表・画像を含む）
2. **解答PDF**: 公式の解答例
3. **採点基準PDF**: 採点講評または出題趣旨

## 解説の生成ルール

### 基本方針
- **日本語で**出力してください。
- 問題文の図表や画像の内容をしっかり読み取り、解説に反映してください。
- 試験合格を目指す受験者に向けた、実践的で分かりやすい解説にしてください。
- 単に解答を示すだけでなく、**なぜその解答になるのか**の根拠を丁寧に説明してください。

### 構成
各大問（問1、問2、...）について、以下の構成で解説を記述してください：

1. **問題の概要**（2〜3文で問題のテーマ・シナリオを要約）
2. **出題のポイント**（この問題で問われている知識・スキル）
3. **設問ごとの解説**
   - 設問の内容を簡潔に示す
   - 正解（解答例）を明記
   - 解答に至るための思考プロセスを丁寧に説明
   - 問題文中の図表やデータの読み取り方を具体的に解説
   - 関連する重要な技術知識・用語の補足説明
   - 誤答しやすいポイントや注意点（落とし穴）があれば記載
4. **採点講評からのアドバイス**（採点講評/出題趣旨の内容を踏まえた学習アドバイス）
5. **関連する学習テーマ**（この問題に関連して復習すべきトピック）

### フォーマット
- Markdown形式で出力してください。
- 大問は `# 問X 解説` の見出し（H1）で始めてください。
- 設問は `## 設問X` の見出し（H2）で記述してください。
- 重要なキーワードは**太字**にしてください。
- 正解は `> **正解**: ...` の引用形式で目立つように記載してください。
- 必要に応じて箇条書き、表、コードブロックを使って見やすくしてください。
- 数式がある場合はTeX形式で $...$ または $$...$$ を使って表現してください。
"""

# ============================================================
# ファイルグループ検出（extract_ipa_generic.py と同じロジック）
# ============================================================
def find_pdf_groups(input_dir):
    """
    PDFファイルを年度・季節・セッションごとにグループ化する
    """
    all_pdfs = sorted(glob.glob(os.path.join(input_dir, "*.pdf")))
    
    groups = defaultdict(lambda: defaultdict(dict))
    
    for pdf_path in all_pdfs:
        basename = os.path.splitext(os.path.basename(pdf_path))[0]
        
        pdf_type = None
        for t in ["mondai", "kaitou", "saiten"]:
            if basename.endswith(f"_{t}"):
                pdf_type = t
                break
        
        if pdf_type is None:
            continue
        
        name_without_type = basename[:-(len(pdf_type) + 1)]
        parts = name_without_type.split("_")
        if len(parts) < 4:
            continue
        
        year_season = f"{parts[0]}_{parts[1]}"
        session = parts[-1]
        
        groups[year_season][session][pdf_type] = pdf_path
    
    sorted_groups = {}
    for ys in sorted(groups.keys()):
        sorted_groups[ys] = dict(sorted(groups[ys].items()))
    
    return sorted_groups


# ============================================================
# 解説生成関数
# ============================================================
def generate_kaisetsu(client, mondai_pdf, kaitou_pdf, saiten_pdf,
                      output_folder, output_md_name, max_retries=5):
    """問題+解答+採点基準の3つのPDFから解説を生成"""
    
    print(f"\n{'='*60}")
    print(f"解説生成中:")
    print(f"  問題: {os.path.basename(mondai_pdf)}")
    print(f"  解答: {os.path.basename(kaitou_pdf)}")
    if saiten_pdf:
        print(f"  採点: {os.path.basename(saiten_pdf)}")
    print(f"  出力: {output_folder}/{output_md_name}")
    print(f"{'='*60}")

    # PDFアップロード
    print("  PDFアップロード中...")
    mondai_upload = client.files.upload(file=mondai_pdf)
    kaitou_upload = client.files.upload(file=kaitou_pdf)
    saiten_upload = None
    if saiten_pdf:
        saiten_upload = client.files.upload(file=saiten_pdf)

    # コンテンツ構築
    content_parts = [
        types.Part(PROMPT_KAISETSU),
        types.Part("【問題PDF】以下は試験問題です："),
        types.Part(mondai_upload),
        types.Part("【解答PDF】以下は公式の解答例です："),
        types.Part(kaitou_upload),
    ]
    if saiten_upload:
        content_parts.append(types.Part("【採点基準PDF】以下は採点講評/出題趣旨です："))
        content_parts.append(types.Part(saiten_upload))

    response = None
    for attempt in range(max_retries):
        try:
            label = f"（リトライ {attempt+1}/{max_retries}）" if attempt > 0 else ""
            print(f"  Gemini APIで解説生成中 [{MODEL_NAME}]...{label}")
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    types.Content(parts=content_parts)
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="text/plain",
                )
            )
            # partsが空の場合リトライ
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
                print(f"  ⚠ サーバーエラー（500）。{wait_time}秒待機... ({attempt+1}/{max_retries})")
                time.sleep(wait_time)
            elif "404" in error_str or "NOT_FOUND" in error_str:
                print(f"  ⚠ モデル404エラー。スキップします...")
                raise
            else:
                raise

    if response is None:
        print(f"  ✗ エラー: {max_retries}回リトライしましたが失敗しました")
        return False

    # テキスト抽出
    kaisetsu_text = ""
    for part in response.parts:
        if part.text:
            kaisetsu_text += part.text

    if not kaisetsu_text.strip():
        print(f"  ✗ エラー: 解説テキストが空です")
        return False

    # Markdown保存
    os.makedirs(output_folder, exist_ok=True)
    md_path = os.path.join(output_folder, output_md_name)
    with open(md_path, "w", encoding="utf-8", newline='\n') as f:
        f.write(kaisetsu_text)
    print(f"  → 解説保存: {output_md_name}")

    usage = response.usage_metadata
    print(f"  トークン使用量: prompt={usage.prompt_token_count}, "
          f"output={usage.candidates_token_count}, "
          f"total={usage.total_token_count}")

    return True


# ============================================================
# メイン
# ============================================================
def main():
    folder_name = os.path.basename(INPUT_DIR)
    print("=" * 60)
    print(f"IPA試験 解説生成スクリプト")
    print(f"対象: {folder_name}")
    print(f"モデル: {MODEL_NAME}")
    print("=" * 60)

    client = genai.Client(api_key=API_KEY)

    # PDFグループ検出
    groups = find_pdf_groups(INPUT_DIR)
    
    # 解説生成対象のカウント
    total_targets = 0
    targets = []
    
    print(f"\n検出された年度・季節: {len(groups)}組")
    for ys, sessions in groups.items():
        session_list = []
        for sess, types_dict in sessions.items():
            has_mondai = "mondai" in types_dict
            has_kaitou = "kaitou" in types_dict
            can_generate = has_mondai and has_kaitou
            
            type_marks = []
            for t in ["mondai", "kaitou", "saiten"]:
                type_marks.append("✓" if t in types_dict else "✗")
            
            status = "→解説可" if can_generate else "→不可"
            session_list.append(f"{sess}(問:{type_marks[0]} 答:{type_marks[1]} 採:{type_marks[2]} {status})")
            
            if can_generate:
                total_targets += 1
                targets.append((ys, sess, types_dict))
        
        print(f"  - {ys}: {', '.join(session_list)}")

    print(f"\n解説生成対象: {total_targets}件")
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
    skip_count = 0

    for idx, (ys, session, types_dict) in enumerate(targets, 1):
        output_folder = os.path.join(INPUT_DIR, ys)
        prefix = f"{session}_"
        md_filename = f"{prefix}解説.md"
        md_path = os.path.join(output_folder, md_filename)

        # スキップ判定
        if os.path.exists(md_path):
            print(f"\n  ⏭ スキップ（処理済み）: {ys}/{md_filename} ({idx}/{total_targets})")
            skip_count += 1
            continue

        # RPDチェック
        if rpd_count >= MAX_RPD:
            print(f"\n  ⛔ 本日のリクエスト上限（{MAX_RPD}回）に達しました。")
            print(f"  明日再度実行してください。処理済みファイルは自動スキップされます。")
            break

        try:
            success = generate_kaisetsu(
                client,
                mondai_pdf=types_dict["mondai"],
                kaitou_pdf=types_dict["kaitou"],
                saiten_pdf=types_dict.get("saiten"),
                output_folder=output_folder,
                output_md_name=md_filename
            )
            if success:
                success_count += 1
                rpd_count += 1
                with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                    json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                print(f"  ✓ 完了 ({idx}/{total_targets}) [本日リクエスト: {rpd_count}/{MAX_RPD}]")
            else:
                error_count += 1
                print(f"  ✗ 失敗 ({idx}/{total_targets})")
        except Exception as e:
            error_count += 1
            print(f"  ✗ エラー ({idx}/{total_targets}): {e}")
            traceback.print_exc()

        # API制限回避
        if idx < total_targets:
            print("  ⏳ 5秒待機中...")
            time.sleep(5)

    # サマリー
    print(f"\n{'='*60}")
    print(f"解説生成完了！")
    print(f"  成功: {success_count}")
    print(f"  失敗: {error_count}")
    print(f"  スキップ: {skip_count}")
    print(f"  本日リクエスト数: {rpd_count}/{MAX_RPD}")
    print(f"  出力先: 各年度フォルダ（{INPUT_DIR} 内）")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

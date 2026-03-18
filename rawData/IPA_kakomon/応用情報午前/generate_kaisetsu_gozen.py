# -*- coding: utf-8 -*-
"""
応用情報技術者試験 午前問題 解説生成スクリプト

問題PDF + 解答PDFを直接Geminiに送信し、
画像を含む内容も読み取った上で各問題の解説を生成します。

使い方:
  python generate_kaisetsu_gozen.py

出力:
  2024_aki/
    解説.md   (80問分の詳細解説)
  2024_haru/
    解説.md
  ...
"""

from google import genai
from google.genai import types
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
INPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_NAME = "gemini-2.5-flash"
MAX_RPD = 10000
RPD_COUNTER_FILE = os.path.join(INPUT_DIR, "rpd_counter.json")

# ============================================================
# 解説生成プロンプト（午前問題用）
# ============================================================
PROMPT_KAISETSU_GOZEN = """
あなたは応用情報技術者試験の専門講師AIです。添付された2つのPDF（問題、解答一覧）を全て読み取り、以下の指示に従って**全問題の詳細な解説**を生成してください。

## 入力PDF
1. **問題PDF**: 午前試験の全80問（4択問題、図表・画像を含む）
2. **解答PDF**: 公式の正解一覧（問1〜問80の正解）

## 解説の生成ルール

### 基本方針
- **日本語で**出力してください。
- **全80問すべて**について解説を生成してください。省略は禁止です。
- 問題文中の図表や画像の内容をしっかり読み取り、解説に反映してください。
- 試験合格を目指す受験者に向けた、実践的で分かりやすい解説にしてください。
- **なぜその選択肢が正解なのか**、**なぜ他の選択肢が不正解なのか**を丁寧に説明してください。

### 各問題の解説構成

各問題について以下の構成で記述してください：

```
## 問X

**正解: ○**

**分野**: （テクノロジ/マネジメント/ストラテジ）

**解説**:
（問題の内容を踏まえた解説。正解の根拠と、各選択肢の正誤判断の理由を説明。）

- **ア**: （この選択肢の説明と正誤の理由）
- **イ**: （この選択肢の説明と正誤の理由）
- **ウ**: （この選択肢の説明と正誤の理由）
- **エ**: （この選択肢の説明と正誤の理由）

**キーワード**: （関連する重要用語をカンマ区切りで列挙）
```

### フォーマット
- Markdown形式で出力してください。
- 冒頭に `# 応用情報技術者試験 午前問題 解説` のタイトルを付けてください。
- 各問題は `## 問X` の見出し（H2）で始めてください。
- 正解は **太字** で目立つように記載してください。
- 重要なキーワードは**太字**にしてください。
- 必要に応じて箇条書き、表、コードブロックを使って見やすくしてください。
- 数式がある場合はTeX形式で $...$ または $$...$$ を使って表現してください。
- 問題文で図表が使われている場合は、図表の内容を言語で説明してから解説してください。

### 注意事項
- 問題番号は問1〜問80の80問です。すべての問題を漏れなく解説してください。
- 各選択肢の解説は具体的に書いてください。「不正解」だけでなく、「なぜ不正解か」を必ず説明してください。
- テクノロジ系（問1-50）、マネジメント系（問51-60）、ストラテジ系（問61-80）の分野を正しく分類してください。
"""

# ============================================================
# ファイルペア検出（extract_ap_gozen.pyと同じロジック）
# ============================================================
def find_pdf_pairs(input_dir):
    mondai_files = sorted(glob.glob(os.path.join(input_dir, "*_AP_gozen_mondai.pdf")))
    kaitou_files = sorted(glob.glob(os.path.join(input_dir, "*_AP_gozen_kaitou.pdf")))

    kaitou_map = {}
    for kf in kaitou_files:
        basename = os.path.basename(kf)
        parts = basename.replace("_AP_gozen_kaitou.pdf", "")
        kaitou_map[parts] = kf

    pairs = []
    for mf in mondai_files:
        basename = os.path.basename(mf)
        folder_name = basename.replace("_AP_gozen_mondai.pdf", "")
        pair = {
            "folder": folder_name,
            "mondai": mf,
            "kaitou": kaitou_map.get(folder_name)
        }
        pairs.append(pair)

    return pairs


# ============================================================
# 解説生成関数
# ============================================================
def generate_kaisetsu(client, mondai_pdf, kaitou_pdf,
                      output_folder, output_md_name, max_retries=5):
    """問題+解答の2つのPDFから解説を生成"""

    print(f"\n{'='*60}")
    print(f"解説生成中:")
    print(f"  問題: {os.path.basename(mondai_pdf)}")
    print(f"  解答: {os.path.basename(kaitou_pdf)}")
    print(f"  出力: {output_folder}/{output_md_name}")
    print(f"{'='*60}")

    # PDFアップロード
    print("  PDFアップロード中...")
    mondai_upload = client.files.upload(file=mondai_pdf)
    kaitou_upload = client.files.upload(file=kaitou_pdf)

    # コンテンツ構築
    content_parts = [
        types.Part(PROMPT_KAISETSU_GOZEN),
        types.Part("【問題PDF】以下は午前試験問題（全80問）です："),
        types.Part(mondai_upload),
        types.Part("【解答PDF】以下は公式の正解一覧です："),
        types.Part(kaitou_upload),
    ]

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

    # 問題数カウント（品質チェック）
    q_count = len(re.findall(r'^## 問\d+', kaisetsu_text, re.MULTILINE))
    print(f"  → 解説された問題数: {q_count}問")
    if q_count < 80:
        print(f"  ⚠ 注意: 80問中{q_count}問のみ解説されています")

    usage = response.usage_metadata
    print(f"  トークン使用量: prompt={usage.prompt_token_count}, "
          f"output={usage.candidates_token_count}, "
          f"total={usage.total_token_count}")

    return True


# ============================================================
# メイン
# ============================================================
def main():
    print("=" * 60)
    print("応用情報技術者試験 午前問題 解説生成スクリプト")
    print(f"モデル: {MODEL_NAME}")
    print("=" * 60)

    client = genai.Client(api_key=API_KEY)

    # PDFペア検出
    pairs = find_pdf_pairs(INPUT_DIR)
    print(f"\n検出された年度・季節: {len(pairs)}組")
    for p in pairs:
        kaitou_status = "✓" if p["kaitou"] else "✗"
        print(f"  - {p['folder']}  (問題: ✓, 解答: {kaitou_status})")

    # 対象カウント
    targets = [p for p in pairs if p["kaitou"]]
    total_targets = len(targets)
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

    for idx, pair in enumerate(targets, 1):
        output_folder = os.path.join(INPUT_DIR, pair["folder"])
        md_filename = "解説.md"
        md_path = os.path.join(output_folder, md_filename)

        # スキップ判定
        if os.path.exists(md_path):
            print(f"\n  ⏭ スキップ（処理済み）: {pair['folder']}/{md_filename} ({idx}/{total_targets})")
            skip_count += 1
            continue

        # RPDチェック
        if rpd_count >= MAX_RPD:
            print(f"\n  ⛔ 本日のリクエスト上限（{MAX_RPD}回）に達しました。")
            print(f"  明日再度実行してください。")
            break

        try:
            success = generate_kaisetsu(
                client,
                mondai_pdf=pair["mondai"],
                kaitou_pdf=pair["kaitou"],
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

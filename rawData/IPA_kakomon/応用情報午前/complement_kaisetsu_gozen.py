# -*- coding: utf-8 -*-
"""
応用情報技術者試験 午前問題 解説補完スクリプト

既存の解説.mdを読み取り、不足している問題番号を検出し、
その問題だけを追加生成してファイル末尾に追記します。

使い方:
  python补完_kaisetsu_gozen.py
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
TOTAL_QUESTIONS = 80

# ============================================================
# 補完用プロンプト
# ============================================================
def build_complement_prompt(missing_numbers):
    """不足問題番号のリストから補完用プロンプトを構築"""
    nums_str = ", ".join([f"問{n}" for n in missing_numbers])
    return f"""
あなたは応用情報技術者試験の専門講師AIです。添付された2つのPDF（問題、解答一覧）を読み取り、以下に指定する問題**のみ**の解説を生成してください。

## 対象問題
以下の問題のみ解説してください（他の問題は不要です）：
{nums_str}

## 入力PDF
1. **問題PDF**: 午前試験問題（全80問中、上記の問題のみ解説）
2. **解答PDF**: 公式の正解一覧

## 各問題の解説構成

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

## ルール
- **日本語で**出力してください。
- 指定された問題**すべて**について解説してください。省略は禁止です。
- 問題文中の図表や画像の内容も読み取って解説に反映してください。
- **なぜその選択肢が正解なのか**、**なぜ他の選択肢が不正解なのか**を丁寧に説明してください。
- テクノロジ系（問1-50）、マネジメント系（問51-60）、ストラテジ系（問61-80）の分野を正しく分類してください。
- Markdown形式で出力してください。
"""


# ============================================================
# 不足問題番号検出
# ============================================================
def detect_missing_questions(md_path, total=TOTAL_QUESTIONS):
    """既存の解説.mdから解説済みの問題番号を抽出し、不足を返す"""
    if not os.path.exists(md_path):
        return list(range(1, total + 1))
    
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # ## 問X のパターンを検出
    found = set()
    for m in re.finditer(r'^##\s*問\s*(\d+)', content, re.MULTILINE):
        found.add(int(m.group(1)))
    
    missing = [n for n in range(1, total + 1) if n not in found]
    return missing


# ============================================================
# ファイルペア検出
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
# 補完解説生成
# ============================================================
def generate_complement(client, mondai_pdf, kaitou_pdf,
                        missing_numbers, output_md_path, max_retries=5):
    """不足問題の解説を生成してファイル末尾に追記"""

    nums_str = ", ".join([f"問{n}" for n in missing_numbers])
    print(f"\n{'='*60}")
    print(f"補完生成中: {os.path.basename(output_md_path)}")
    print(f"  不足問題: {nums_str} ({len(missing_numbers)}問)")
    print(f"{'='*60}")

    # 一度に処理する問題数の上限（トークン制限対策）
    BATCH_SIZE = 30
    
    all_text = ""
    
    for batch_start in range(0, len(missing_numbers), BATCH_SIZE):
        batch = missing_numbers[batch_start:batch_start + BATCH_SIZE]
        batch_label = f"バッチ {batch_start//BATCH_SIZE + 1}/{(len(missing_numbers)-1)//BATCH_SIZE + 1}"
        
        if len(missing_numbers) > BATCH_SIZE:
            print(f"\n  --- {batch_label}: 問{batch[0]}〜問{batch[-1]} ({len(batch)}問) ---")

        prompt = build_complement_prompt(batch)

        # PDFアップロード
        print("  PDFアップロード中...")
        mondai_upload = client.files.upload(file=mondai_pdf)
        kaitou_upload = client.files.upload(file=kaitou_pdf)

        content_parts = [
            types.Part(prompt),
            types.Part("【問題PDF】以下は午前試験問題です："),
            types.Part(mondai_upload),
            types.Part("【解答PDF】以下は公式の正解一覧です："),
            types.Part(kaitou_upload),
        ]

        response = None
        for attempt in range(max_retries):
            try:
                label = f"（リトライ {attempt+1}/{max_retries}）" if attempt > 0 else ""
                print(f"  Gemini APIで補完生成中 [{MODEL_NAME}]...{label}")
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=[types.Content(parts=content_parts)],
                    config=types.GenerateContentConfig(
                        response_mime_type="text/plain",
                    )
                )
                if not response.parts:
                    print(f"  ⚠ partsが空。リトライ... ({attempt+1}/{max_retries})")
                    wait_time = 15 * (2 ** attempt)
                    time.sleep(wait_time)
                    response = None
                    continue
                break
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    wait_time = 60 * (2 ** attempt)
                    print(f"  ⚠ レート制限。{wait_time}秒待機...")
                    time.sleep(wait_time)
                elif "500" in error_str or "INTERNAL" in error_str:
                    wait_time = 30 * (2 ** attempt)
                    print(f"  ⚠ サーバーエラー。{wait_time}秒待機... ({attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    raise

        if response is None:
            print(f"  ✗ {batch_label} 失敗")
            continue

        batch_text = ""
        for part in response.parts:
            if part.text:
                batch_text += part.text

        if batch_text.strip():
            all_text += "\n\n" + batch_text
            # 生成された問題数チェック
            generated = set()
            for m in re.finditer(r'^##\s*問\s*(\d+)', batch_text, re.MULTILINE):
                generated.add(int(m.group(1)))
            print(f"  → {len(generated)}問の解説を生成")

            usage = response.usage_metadata
            print(f"  トークン: prompt={usage.prompt_token_count}, "
                  f"output={usage.candidates_token_count}, "
                  f"total={usage.total_token_count}")
        
        # バッチ間待機
        if batch_start + BATCH_SIZE < len(missing_numbers):
            print("  ⏳ 5秒待機中...")
            time.sleep(5)

    if not all_text.strip():
        print(f"  ✗ 補完テキストが空です")
        return False

    # 既存ファイルに追記
    with open(output_md_path, "a", encoding="utf-8", newline='\n') as f:
        f.write("\n\n<!-- 以下は補完生成された解説です -->\n")
        f.write(all_text)
    print(f"\n  → 補完追記完了: {os.path.basename(output_md_path)}")

    return True


# ============================================================
# メイン
# ============================================================
def main():
    print("=" * 60)
    print("応用情報午前 解説補完スクリプト")
    print(f"モデル: {MODEL_NAME}")
    print("=" * 60)

    client = genai.Client(api_key=API_KEY)
    pairs = find_pdf_pairs(INPUT_DIR)

    # 各年度の不足状況を調査
    targets = []
    print(f"\n不足問題の検出:") 
    for pair in pairs:
        if not pair["kaitou"]:
            continue
        md_path = os.path.join(INPUT_DIR, pair["folder"], "解説.md")
        missing = detect_missing_questions(md_path)
        status = f"不足{len(missing)}問" if missing else "完了✅"
        if missing:
            missing_preview = ", ".join([f"問{n}" for n in missing[:10]])
            if len(missing) > 10:
                missing_preview += f" ...他{len(missing)-10}問"
            print(f"  - {pair['folder']}: {status} [{missing_preview}]")
            targets.append((pair, missing))
        else:
            print(f"  - {pair['folder']}: {status}")

    if not targets:
        print("\n全年度の解説が完了しています！補完の必要はありません。")
        return

    print(f"\n補完対象: {len(targets)}年度")
    total_missing = sum(len(m) for _, m in targets)
    print(f"不足問題の合計: {total_missing}問\n")

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
    for idx, (pair, missing) in enumerate(targets, 1):
        md_path = os.path.join(INPUT_DIR, pair["folder"], "解説.md")

        if rpd_count >= MAX_RPD:
            print(f"\n  ⛔ 本日のリクエスト上限に達しました。")
            break

        try:
            success = generate_complement(
                client,
                mondai_pdf=pair["mondai"],
                kaitou_pdf=pair["kaitou"],
                missing_numbers=missing,
                output_md_path=md_path
            )
            if success:
                success_count += 1
                # バッチ数分カウント
                batch_count = (len(missing) - 1) // 30 + 1
                rpd_count += batch_count
                with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                    json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                
                # 補完後に再度チェック
                still_missing = detect_missing_questions(md_path)
                if still_missing:
                    print(f"  ⚠ まだ{len(still_missing)}問不足: {', '.join([f'問{n}' for n in still_missing[:10]])}")
                else:
                    print(f"  ✅ 全80問の解説が揃いました！")
                
                print(f"  ✓ ({idx}/{len(targets)}) [リクエスト: {rpd_count}/{MAX_RPD}]")
        except Exception as e:
            print(f"  ✗ エラー ({idx}/{len(targets)}): {e}")
            traceback.print_exc()

        if idx < len(targets):
            print("  ⏳ 5秒待機中...")
            time.sleep(5)

    # サマリー
    print(f"\n{'='*60}")
    print(f"補完完了！ 処理: {success_count}/{len(targets)}年度")
    print(f"本日リクエスト数: {rpd_count}/{MAX_RPD}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

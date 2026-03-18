# -*- coding: utf-8 -*-
"""
FP試験 PDF → Markdown + 画像 + 解説 抽出スクリプト

各フォルダ（FP2級座学, FP2級実技, FP3級座学, FP3級実技）に配置して実行。
_q.pdf（問題）+ _a.pdf（解答）のペア、または _qa.pdf（問題解答一体型）を検出し、
Gemini APIで解析してMarkdown + 画像 + 解説を生成します。

出力:
  YYYYMM/
    問題.md
    解答.md       （_a.pdfがある場合）
    解説.md
    問題XX.png    （図表がある場合）
    extractions.json
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
INPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_NAME = "gemini-2.5-flash"
MAX_RPD = 10000
RPD_COUNTER_FILE = os.path.join(INPUT_DIR, "rpd_counter.json")

# ============================================================
# プロンプト（問題用）
# ============================================================
PROMPT_MONDAI = """
あなたは高度な文書解析の専門AIです。添付されたPDF（FP技能士試験の問題）を解析し、以下の指示に従って「1. 図表のJSONリスト」および「2. 問題内容のMarkdownテキスト」を出力してください。

### 1. 処理の基本ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- **読解順序**: 問題番号順にテキストを抽出してください。
- **欠落の禁止**: いかなる問題、選択肢も省略したり要約したりせず、全文を抽出してください。
- **除外事項**: ページ番号、ヘッダー、フッターの抽出は不要です。

### 2. 図と表の抽出リスト (JSON形式)
- 問題文中に含まれるすべての「図」「表」「グラフ」「イラスト」「画像として表現された数式や図形」等を特定してください。
- テキストとして十分に表現できる簡単な表は、図表として抽出せずMarkdownの表として記述してください。
- 各図表について座標（Bounding Box）を **0から1000の範囲（正規化座標）** で `[ymin, xmin, ymax, xmax]` の順に出力してください。
- `page_number` は 1 から始まるページ番号です。
- `question_number` は図表が含まれる問題の番号です。
- `filename` は「問題XX.png」で命名してください。同じ問題に複数の図表がある場合は「問題XX_1.png」「問題XX_2.png」のように連番をつけてください。

### 3. ドキュメント内容 (Markdown形式)
- 各問題は `## 問X` の見出し（H2）で始めてください。
- 問題文はそのまま正確に記述してください。
- 選択肢は原文の表記をそのまま維持してください。
- 図表がある位置には `![図表の説明](問題XX.png)` を挿入してください。
- 数式がある場合はTeX形式で表現してください。
"""

# ============================================================
# プロンプト（解答用）
# ============================================================
PROMPT_KAITOU = """
あなたは高度な文書解析の専門AIです。添付されたPDF（FP技能士試験の解答一覧）を解析し、以下の指示に従って出力してください。

### 処理ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- 解答表のすべての問題番号と正解を抽出してください。
- 欠落は禁止です。すべての問題の解答を抽出してください。

### 出力形式
- 図表の抽出リスト (extractions) は空リストにしてください。
- Markdown形式で出力してください:

```
# 解答一覧

| 問題番号 | 正解 |
|---------|------|
| 問1 | ... |
| 問2 | ... |
...
```
"""

# ============================================================
# プロンプト（QA一体型用）
# ============================================================
PROMPT_QA = """
あなたは高度な文書解析の専門AIです。添付されたPDF（FP技能士試験の問題と解答が一体になったもの）を解析し、以下の指示に従って「1. 図表のJSONリスト」および「2. 問題と解答内容のMarkdownテキスト」を出力してください。

### 1. 処理の基本ルール
- **翻訳は不要**: 日本語のまま、原文をそのまま正確に抽出してください。
- **読解順序**: 問題番号順にテキストを抽出してください。
- **欠落の禁止**: いかなる問題、選択肢も省略したり要約したりせず、全文を抽出してください。
- **除外事項**: ページ番号、ヘッダー、フッターの抽出は不要です。

### 2. 図と表の抽出リスト (JSON形式)
- 問題文中に含まれるすべての図・表・グラフ等を特定してください。
- テキストで十分な簡単な表はMarkdownの表として記述してください。
- 座標は **0〜1000の正規化座標** で `[ymin, xmin, ymax, xmax]` の順に出力してください。
- `filename` は「問題XX.png」で命名してください。

### 3. ドキュメント内容 (Markdown形式)
- 各問題は `## 問X` の見出し（H2）で始めてください。
- 問題文の後に、**正解**を明記してください（例: `> **正解**: ア`）。
- 問題文はそのまま正確に、選択肢も原文のまま記述してください。
- 図表がある位置には `![図表の説明](問題XX.png)` を挿入してください。
"""

# ============================================================
# プロンプト（解説用）
# ============================================================
PROMPT_KAISETSU = """
あなたはFP技能士試験の専門講師AIです。添付されたPDF（問題と解答）を全て読み取り、**全問題の詳細な解説**を生成してください。

## 入力PDF
添付されたPDFには問題と解答が含まれています。

## 解説の生成ルール

### 基本方針
- **日本語で**出力してください。
- **全問題すべて**について解説を生成してください。省略は禁止です。
- 問題文中の図表や画像の内容も読み取って解説に反映してください。
- **なぜその選択肢/回答が正解なのか**を丁寧に説明してください。

### 各問題の解説構成

```
## 問X

**正解: ○**

**分野**: （ライフプランニング/リスク管理/金融資産運用/タックスプランニング/不動産/相続・事業承継）

**解説**:
（解説内容。正解の根拠と各選択肢の正誤の理由。）

**キーワード**: （関連する重要用語をカンマ区切りで列挙）
```

### フォーマット
- Markdown形式で出力してください。
- 冒頭に `# FP技能士試験 解説` のタイトルを付けてください。
- 各問題は `## 問X` の見出し（H2）で始めてください。
- 不正解の選択肢についても「なぜ不正解か」を具体的に説明してください。
"""

# ============================================================
# Pydantic モデル
# ============================================================
class FigureTableItem(BaseModel):
    question_number: int = Field(description="図表が含まれる問題の番号")
    filename: str = Field(description="保存するファイル名（例: 問題15.png）")
    page_number: int = Field(description="1から始まるページ番号")
    box_2d: List[int] = Field(
        description="[ymin, xmin, ymax, xmax] 0-1000正規化座標",
        min_length=4, max_length=4
    )
    type: Literal["figure", "table"] = Field(description="図(figure)か表(table)か")
    caption: str = Field(description="図表の簡単な説明")


class DocumentExtractionResponse(BaseModel):
    extractions: List[FigureTableItem] = Field(description="図表リスト")
    content_markdown: str = Field(description="Markdown形式の全内容")


# ============================================================
# 画像抽出
# ============================================================
def crop_images_from_pdf(pdf_path, extractions, output_dir, padding_ratio=0.05):
    if not extractions:
        print("  → 図表なし（画像抽出スキップ）")
        return
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    for item in extractions:
        try:
            page_num = item.page_number - 1
            if page_num < 0 or page_num >= len(doc):
                continue
            ymin, xmin, ymax, xmax = item.box_2d
            w = xmax - xmin; h = ymax - ymin
            xmin_n = max(0, xmin - w * padding_ratio)
            xmax_n = min(1000, xmax + w * padding_ratio)
            ymin_n = max(0, ymin - h * padding_ratio)
            ymax_n = min(1000, ymax + h * padding_ratio)
            page = doc.load_page(page_num)
            pw, ph = page.rect.width, page.rect.height
            rect = fitz.Rect(
                (xmin_n/1000)*pw, (ymin_n/1000)*ph,
                (xmax_n/1000)*pw, (ymax_n/1000)*ph
            )
            mat = fitz.Matrix(3.0, 3.0)
            pix = page.get_pixmap(matrix=mat, clip=rect)
            pix.save(os.path.join(output_dir, item.filename))
            print(f"  → 画像保存: {item.filename}")
        except Exception as e:
            print(f"  ⚠ 画像エラー ({item.filename}): {e}")
    doc.close()


# ============================================================
# PDF処理（構造化出力）
# ============================================================
def process_pdf_structured(client, pdf_path, output_folder, output_md_name,
                           prompt, extract_images=True, max_retries=5):
    pdf_name = os.path.basename(pdf_path)
    print(f"\n{'='*60}")
    print(f"処理中: {pdf_name} → {output_md_name}")
    print(f"{'='*60}")

    print("  PDFアップロード中...")
    file_upload = client.files.upload(file=pdf_path)

    response = None
    for attempt in range(max_retries):
        try:
            label = f"（リトライ {attempt+1}/{max_retries}）" if attempt > 0 else ""
            print(f"  Gemini APIで解析中 [{MODEL_NAME}]...{label}")
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[types.Content(parts=[
                    types.Part(prompt), types.Part(file_upload)
                ])],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DocumentExtractionResponse
                )
            )
            if not response.parts:
                print(f"  ⚠ partsが空。リトライ... ({attempt+1}/{max_retries})")
                time.sleep(15 * (2 ** attempt))
                response = None
                continue
            break
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                time.sleep(60 * (2 ** attempt))
                print(f"  ⚠ レート制限。待機中...")
            elif "500" in err or "INTERNAL" in err:
                time.sleep(30 * (2 ** attempt))
                print(f"  ⚠ サーバーエラー。待機中...")
            else:
                raise

    if response is None:
        print(f"  ✗ 失敗")
        return None

    result = None
    for part in response.parts:
        if part.text and not (hasattr(part, 'thought') and part.thought):
            result = json.loads(part.text)
            break
    if result is None:
        print(f"  ✗ レスポンス取得失敗")
        return None

    data = DocumentExtractionResponse(**result)
    os.makedirs(output_folder, exist_ok=True)

    md_path = os.path.join(output_folder, output_md_name)
    md_content = data.content_markdown.replace('\\n', '\n')
    with open(md_path, "w", encoding="utf-8", newline='\n') as f:
        f.write(md_content)
    print(f"  → Markdown保存: {output_md_name}")

    if extract_images and data.extractions:
        json_path = os.path.join(output_folder, "extractions.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump([i.model_dump() for i in data.extractions], f, ensure_ascii=False, indent=2)
        print(f"  → JSON保存: extractions.json（{len(data.extractions)}件）")
        crop_images_from_pdf(pdf_path, data.extractions, output_folder)

    usage = response.usage_metadata
    print(f"  トークン: prompt={usage.prompt_token_count}, "
          f"output={usage.candidates_token_count}, total={usage.total_token_count}")
    return data


# ============================================================
# 解説生成（テキスト出力）
# ============================================================
def generate_kaisetsu(client, pdf_paths, output_folder, output_md_name, max_retries=5):
    print(f"\n{'='*60}")
    print(f"解説生成中 → {output_md_name}")
    print(f"{'='*60}")

    print("  PDFアップロード中...")
    content_parts = [types.Part(PROMPT_KAISETSU)]
    for p in pdf_paths:
        upload = client.files.upload(file=p)
        content_parts.append(types.Part(f"【{os.path.basename(p)}】:"))
        content_parts.append(types.Part(upload))

    response = None
    for attempt in range(max_retries):
        try:
            label = f"（リトライ {attempt+1}/{max_retries}）" if attempt > 0 else ""
            print(f"  Gemini APIで解説生成中 [{MODEL_NAME}]...{label}")
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[types.Content(parts=content_parts)],
                config=types.GenerateContentConfig(response_mime_type="text/plain")
            )
            if not response.parts:
                print(f"  ⚠ partsが空。リトライ...")
                time.sleep(15 * (2 ** attempt))
                response = None
                continue
            break
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                time.sleep(60 * (2 ** attempt))
            elif "500" in err or "INTERNAL" in err:
                time.sleep(30 * (2 ** attempt))
            else:
                raise

    if response is None:
        print(f"  ✗ 解説生成失敗")
        return False

    text = "".join(p.text for p in response.parts if p.text)
    if not text.strip():
        return False

    os.makedirs(output_folder, exist_ok=True)
    with open(os.path.join(output_folder, output_md_name), "w", encoding="utf-8", newline='\n') as f:
        f.write(text)
    print(f"  → 解説保存: {output_md_name}")

    usage = response.usage_metadata
    print(f"  トークン: prompt={usage.prompt_token_count}, "
          f"output={usage.candidates_token_count}, total={usage.total_token_count}")
    return True


# ============================================================
# ファイルグループ検出
# ============================================================
def find_pdf_groups(input_dir):
    """PDFを回次ごとにグループ化
    パターン: {prefix}_{YYYYMM}_{q|a|qa}.pdf
    """
    pdfs = sorted(glob.glob(os.path.join(input_dir, "*.pdf")))
    groups = {}

    for pdf in pdfs:
        basename = os.path.splitext(os.path.basename(pdf))[0]
        # 末尾の _q, _a, _qa を検出
        if basename.endswith("_qa"):
            pdf_type = "qa"
            key = basename[:-3]  # remove _qa
        elif basename.endswith("_q"):
            pdf_type = "q"
            key = basename[:-2]  # remove _q
        elif basename.endswith("_a"):
            pdf_type = "a"
            key = basename[:-2]  # remove _a
        else:
            continue

        # keyから YYYYMM を抽出（例: g3_202305 → 202305）
        m = re.search(r'(\d{6})', key)
        if not m:
            continue
        period = m.group(1)

        if period not in groups:
            groups[period] = {}
        groups[period][pdf_type] = pdf

    return dict(sorted(groups.items()))


# ============================================================
# メイン
# ============================================================
def main():
    folder_name = os.path.basename(INPUT_DIR)
    print("=" * 60)
    print(f"FP試験 PDF → Markdown + 画像 + 解説 抽出")
    print(f"対象: {folder_name}")
    print(f"モデル: {MODEL_NAME}")
    print("=" * 60)

    client = genai.Client(api_key=API_KEY)
    groups = find_pdf_groups(INPUT_DIR)

    print(f"\n検出された回次: {len(groups)}組")
    for period, files in groups.items():
        types_str = ", ".join(sorted(files.keys()))
        print(f"  - {period}: {types_str}")

    # RPDカウンター
    today_str = time.strftime("%Y-%m-%d")
    rpd_count = 0
    if os.path.exists(RPD_COUNTER_FILE):
        with open(RPD_COUNTER_FILE, "r", encoding="utf-8") as f:
            counter_data = json.load(f)
            if counter_data.get("date") == today_str:
                rpd_count = counter_data.get("count", 0)
    print(f"\n本日のリクエスト済み回数: {rpd_count}/{MAX_RPD}\n")

    success_count = 0
    error_count = 0

    for period, files in groups.items():
        output_folder = os.path.join(INPUT_DIR, period)

        has_qa = "qa" in files
        has_q = "q" in files
        has_a = "a" in files

        # ---- 問題抽出 ----
        mondai_md = os.path.join(output_folder, "問題.md")
        if os.path.exists(mondai_md):
            print(f"\n  ⏭ スキップ: {period}/問題.md")
        elif rpd_count >= MAX_RPD:
            print(f"\n  ⛔ RPD上限")
            break
        else:
            try:
                if has_qa:
                    # QA一体型
                    result = process_pdf_structured(
                        client, files["qa"], output_folder, "問題.md",
                        PROMPT_QA, extract_images=True
                    )
                elif has_q:
                    result = process_pdf_structured(
                        client, files["q"], output_folder, "問題.md",
                        PROMPT_MONDAI, extract_images=True
                    )
                else:
                    result = None

                if result:
                    success_count += 1
                    rpd_count += 1
                    with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                        json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                    print(f"  ✓ 問題完了 [リクエスト: {rpd_count}/{MAX_RPD}]")
                else:
                    error_count += 1
            except Exception as e:
                error_count += 1
                print(f"  ✗ エラー: {e}")
                traceback.print_exc()
            time.sleep(5)

        # ---- 解答抽出（_a.pdfがある場合のみ）----
        if has_a:
            kaitou_md = os.path.join(output_folder, "解答.md")
            if os.path.exists(kaitou_md):
                print(f"  ⏭ スキップ: {period}/解答.md")
            elif rpd_count >= MAX_RPD:
                print(f"  ⛔ RPD上限")
                break
            else:
                try:
                    result = process_pdf_structured(
                        client, files["a"], output_folder, "解答.md",
                        PROMPT_KAITOU, extract_images=False
                    )
                    if result:
                        success_count += 1
                        rpd_count += 1
                        with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                            json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                        print(f"  ✓ 解答完了 [リクエスト: {rpd_count}/{MAX_RPD}]")
                    else:
                        error_count += 1
                except Exception as e:
                    error_count += 1
                    print(f"  ✗ エラー: {e}")
                    traceback.print_exc()
                time.sleep(5)

        # ---- 解説生成 ----
        kaisetsu_md = os.path.join(output_folder, "解説.md")
        if os.path.exists(kaisetsu_md):
            print(f"  ⏭ スキップ: {period}/解説.md")
        elif rpd_count >= MAX_RPD:
            print(f"  ⛔ RPD上限")
            break
        else:
            try:
                # 送信するPDFリスト（問題+解答 or QA一体型）
                pdfs_for_kaisetsu = []
                if has_qa:
                    pdfs_for_kaisetsu.append(files["qa"])
                else:
                    if has_q:
                        pdfs_for_kaisetsu.append(files["q"])
                    if has_a:
                        pdfs_for_kaisetsu.append(files["a"])

                if pdfs_for_kaisetsu:
                    ok = generate_kaisetsu(
                        client, pdfs_for_kaisetsu, output_folder, "解説.md"
                    )
                    if ok:
                        success_count += 1
                        rpd_count += 1
                        with open(RPD_COUNTER_FILE, "w", encoding="utf-8") as f:
                            json.dump({"date": today_str, "count": rpd_count, "model": MODEL_NAME}, f)
                        print(f"  ✓ 解説完了 [リクエスト: {rpd_count}/{MAX_RPD}]")
                    else:
                        error_count += 1
            except Exception as e:
                error_count += 1
                print(f"  ✗ エラー: {e}")
                traceback.print_exc()
            time.sleep(5)

    print(f"\n{'='*60}")
    print(f"処理完了！ 成功: {success_count}, 失敗: {error_count}")
    print(f"本日リクエスト数: {rpd_count}/{MAX_RPD}")
    print(f"出力先: {INPUT_DIR}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
FP試験 全フォルダ一括処理ランナー

使い方:
  python run_all_fp.py
"""
import subprocess
import os
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FOLDERS = [
    "FP3級座学",
    "FP3級実技",
    "FP2級座学",
    "FP2級実技",
]

def main():
    print("=" * 60)
    print("FP試験 全フォルダ一括処理ランナー")
    print("=" * 60)

    for i, folder in enumerate(FOLDERS, 1):
        folder_path = os.path.join(BASE_DIR, folder)
        script_path = os.path.join(folder_path, "extract_fp.py")

        if not os.path.exists(script_path):
            print(f"\n⚠ スクリプトが見つかりません: {folder}")
            continue

        print(f"\n{'#'*60}")
        print(f"# [{i}/{len(FOLDERS)}] {folder}")
        print(f"{'#'*60}")

        try:
            result = subprocess.run(
                [sys.executable, script_path],
                cwd=folder_path,
                check=False
            )
            if result.returncode == 0:
                print(f"\n✓ {folder} 完了")
            else:
                print(f"\n✗ {folder} 終了コード: {result.returncode}")
        except Exception as e:
            print(f"\n✗ {folder} エラー: {e}")

        if i < len(FOLDERS):
            print(f"\n⏳ 次のフォルダまで10秒待機...")
            time.sleep(10)

    print(f"\n{'='*60}")
    print("全フォルダ処理完了！")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

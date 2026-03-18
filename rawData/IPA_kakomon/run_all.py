# -*- coding: utf-8 -*-
"""
全フォルダの extract_ipa_generic.py を順番に実行するランナースクリプト

使い方:
  python run_all.py
"""

import subprocess
import os
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 処理対象フォルダ一覧（応用情報午前は別スクリプトで処理済み）
FOLDERS = [
    "データベーススペシャリスト",
    "ネットワークスペシャリスト",
    "情報処理安全確保支援",
    "プロジェクトマネージャー",
    "ITサービスマネージャー",
    "ITストラテジスト",
    "エンベデッドシステムスペシャリスト",
    "システムアーキテクト",
    "システム監査技術者",
    "応用情報＿午後",
]

def main():
    print("=" * 60)
    print("IPA試験 全フォルダ一括処理ランナー")
    print("=" * 60)

    for i, folder in enumerate(FOLDERS, 1):
        folder_path = os.path.join(BASE_DIR, folder)
        script_path = os.path.join(folder_path, "extract_ipa_generic.py")

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

        # フォルダ間の待機
        if i < len(FOLDERS):
            print(f"\n⏳ 次のフォルダまで10秒待機...")
            time.sleep(10)

    print(f"\n{'='*60}")
    print("全フォルダ処理完了！")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

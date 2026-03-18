# -*- coding: utf-8 -*-
"""
全フォルダの解説生成を一括実行するランナースクリプト
"""
import subprocess
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 処理対象フォルダ
TARGET_FOLDERS = [
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
    print("IPA試験 解説生成 全フォルダ一括処理")
    print("=" * 60)

    for idx, folder in enumerate(TARGET_FOLDERS, 1):
        folder_path = os.path.join(BASE_DIR, folder)
        script_path = os.path.join(folder_path, "generate_kaisetsu.py")

        print(f"\n{'#'*60}")
        print(f"# [{idx}/{len(TARGET_FOLDERS)}] {folder}")
        print(f"{'#'*60}")

        if not os.path.exists(script_path):
            print(f"  ⚠ スクリプトが見つかりません: {script_path}")
            continue

        result = subprocess.run(
            ["python", "generate_kaisetsu.py"],
            cwd=folder_path,
            check=False
        )

        if result.returncode == 0:
            print(f"\n✓ {folder} 完了")
        else:
            print(f"\n✗ {folder} エラー (exit code: {result.returncode})")

        if idx < len(TARGET_FOLDERS):
            print("⏳ 次のフォルダまで10秒待機...")
            time.sleep(10)

    print(f"\n{'='*60}")
    print("全フォルダ処理完了！")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

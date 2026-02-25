# トップ画面のモダン化およびダッシュボードの削除

## 目的

使用されていないダッシュボード画面を削除し、トップ画面（`TopScreen`）をよりモダンで洗練されたデザインに刷新する。

## 修正内容

### 1. ダッシュボード画面の削除

以下のファイルを使用されていないため完全に削除します。

- `[DELETE] DashboardScreen.tsx` (file:///c:/Users/shugo/cloudworkbook/src/frontend/screens/DashboardScreen.tsx)
- `[DELETE] DashboardScreen.md` (file:///c:/Users/shugo/cloudworkbook/docs/design/screens/DashboardScreen.md)

### 2. トップ画面のモダンデザイン化

`TopScreen.tsx` を以下のモダンなデザインに改修します。

- **[MODIFY] TopScreen.tsx** (file:///c:/Users/shugo/cloudworkbook/src/frontend/screens/TopScreen.tsx)
  - **背景とレイアウト**: 単一の白背景から、柔らかいグラデーション（例: `bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-cyan-50`）に変更し、モダンで軽やかな印象にします。
  - **タイポグラフィ**: 視認性の高い見出し設定（`tracking-tight`）と、テキストカラーの適切なコントラスト（`text-muted-foreground`）等の整理を行います。
  - **アニメーション表示**: `tailwindcss-animate` を活用し、ページ読み込み時に要素がふんわりと浮かび上がるようなインアニメーション（`animate-in fade-in slide-in-from-bottom-4` 等）を追加します。
  - **試験一覧カード (Cards)**:
    - ただの枠線付き（白）の四角から、やわらかなシャドウ（`shadow-md hover:shadow-xl`）や角丸（`rounded-2xl`）を適用します。
    - ホバー時にカードがわずかに上に浮き上がるアニメーション（`hover:-translate-y-1 hover:border-primary/50`）を追加し、リッチなインタラクションを提供します。
    - アイコンごとにアクセントの背景色を引き、視覚的な退屈さを無くします。

## ユーザー確認事項

- 上記のデザイン案で進めてよろしいでしょうか？
- トップページのメインカラーとして、特定の色使いのご要望はありますでしょうか？（指定がなければ、現状のブランドイメージに合わせた爽やかなブルー〜グレー系のグラデーションを主軸とします）

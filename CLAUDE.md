# CLAUDE.md

このファイルは Claude Code / Antigravity が本リポジトリで作業する際の前提情報をまとめたものです。

## プロジェクト概要

**WHERE 見積書メーカー** — 株式会社WHEREの営業メンバーが顧客向け見積書を作成するための内製ツール。Gmail のメール作成画面から起動でき、PDF をメール添付・Drive 保存・Slack 通知まで自動化する。

- **エンドユーザー**: WHERE 営業担当
- **公開先**: GitHub Pages (`https://tanaka-where.github.io/WHERE_Estimate_Maker/`)
- **本体**: 単一 HTML ファイル（`WHERE 見積書メーカー.html`）+ Chrome拡張

## 技術スタック

- **フロントエンド**: Vanilla HTML/CSS/JS（React/Babel/html2pdf.js は CDN 経由）
- **データ**: `variables.json`（プラン・税率・俸数・担当者等を集約）+ JSON Schema
- **拡張**: Chrome 拡張（Manifest V3、OAuth2、Slack Webhook）
- **CI**: GitHub Actions（`variables.json` の Schema バリデーション）
- **配信**: GitHub Pages

## ディレクトリ構造

```
where-estimate/
├── WHERE 見積書メーカー.html    # 本体（単一HTML、ブラウザで動作）
├── styles.css                    # スタイル
├── assets/                       # ロゴ等
├── logic.html                    # 算出ロジックの公開ページ（誰でも閲覧可）
├── variables.json                # 全変数（プラン、税率、俸数、担当者等）
├── variables.schema.json         # variables.json の JSON Schema
├── chrome-extension/             # Gmail 挿入ボタンを提供する Chrome 拡張
├── .github/workflows/            # PR/push 時の variables.json バリデーション
├── docs/                         # ドキュメント
├── uploads/                      # アップロード画像（ロゴ等）
├── app.jsx, data.js, *.jsx       # 旧設計用ソース（参考用、ランタイムは HTML 内インライン）
├── README.md                     # セットアップ・運用手順（詳細はこちら）
└── .workspace/                   # ← AI生成物の置き場（後述）
```

## .workspace/ の使い分け（AI生成物の出力先ルール）

`.workspace/` は AI ツールが生成する一時的・参考用の成果物の置き場。本番コードと混在させない。

- `.workspace/claude-code/` — Claude Code が生成する実験的スクリプト・調査結果
- `.workspace/claude-web/` — claude.ai でダウンロードした成果物（手動配置）
  - `designs/where-estimate-maker/` — claude.ai でデザイン検討した時の素材一式（参考用、本番コードへの反映は手動マージ）
- `.workspace/antigravity/` — Antigravity が生成する実験的成果物

**重要**: `.workspace/` 配下は本番コードに直接反映しない。必要な変更があればルート直下のファイルへ手動で取り込む。

## コーディング規約・運用ルール

### 編集の基本方針

1. **データ変更は `variables.json` のみ** — プラン金額・税率・担当者などは全て JSON 経由。HTML 内ハードコードは禁止。
2. **Schema 駆動** — `variables.json` の構造を変える時は `variables.schema.json` も同時更新。`.github/workflows/` の CI が拒否する。
3. **単一 HTML を保つ** — `WHERE 見積書メーカー.html` は意図的に単一ファイル。CDN 経由のライブラリ追加は OK だが、ローカルファイル分割は避ける。

### 変更フロー

```bash
# 1. ブランチ作成
git checkout -b update-variables

# 2. variables.json を編集

# 3. PR 作成（GitHub Actions が自動でバリデーション）
git add variables.json
git commit -m "プラン料額を改定"
git push -u origin update-variables
gh pr create
```

PR がマージされると GitHub Pages 経由で全ユーザーに即時反映される。

## 開発・起動コマンド

ローカル動作確認は単純にブラウザで開くだけ:

```bash
# Windows
start "WHERE 見積書メーカー.html"
```

ライブラリは全て CDN 経由のため `npm install` 等は不要。

## 既知の注意事項

- **Gmail DOM 依存**: Chrome 拡張は Gmail の DOM 構造に依存。Gmail 側の更新で挿入処理が壊れる可能性あり。`content-script.js` の `attachToCompose` を要メンテ。
- **PDF レンダリング**: 日本語フォントは Google Fonts の Noto Sans JP に依存。オフライン環境ではシステムフォントへフォールバックする。
- **OAuth**: Chrome 拡張は Chrome ストア公開 or Workspace 管理者からのインストールが必要になる場合あり（`chrome.identity.getAuthToken` の制限）。
- **ファイル名に日本語**: `WHERE 見積書メーカー.html` のようにファイル名が日本語。`git config --global core.quotepath false` を設定しないと `git status` で文字化け表示される（中身は正常）。

## 参考リンク

- 算出ロジック: [`logic.html`](logic.html)
- 詳細セットアップ手順: [`README.md`](README.md)
- 公開URL: https://tanaka-where.github.io/WHERE_Estimate_Maker/

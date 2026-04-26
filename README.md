# WHERE 見積書メーカー

営業メンバー向けの見積書作成ツール。Gmail のメール作成画面から起動でき、
PDF をメール添付・Drive 保存・Slack 通知まで自動化する。

## 構成

| ファイル / ディレクトリ          | 用途                                                       |
|-----------------------------------|-----------------------------------------------------------|
| `WHERE 見積書メーカー.html`       | エディタ本体（単一HTML、ブラウザで動作）                   |
| `styles.css`, `assets/`           | スタイル / ロゴ等                                          |
| `logic.html`                      | 算出ロジックの公開ページ（誰でも閲覧可能）                 |
| `variables.json`                  | 全変数（プラン、税率、係数、担当者等）                     |
| `variables.schema.json`           | `variables.json` の JSON Schema                            |
| `chrome-extension/`               | Gmail に「WHERE 見積書を作成」ボタンを注入する Chrome 拡張 |
| `.github/workflows/`              | PR / push 時の variables.json バリデーション               |
| `data.js`, `*.jsx`                | 旧設計用ソース（参考用、ランタイムは HTML 内にインライン） |

## エディタ単体の使い方

1. リポジトリ一式をダウンロード（または GitHub Pages にデプロイ）
2. `WHERE 見積書メーカー.html` をブラウザで開く
3. 起動モーダルで顧客名・件名・営業担当・契約期間・プラン・各日付を入力
4. 「編集をスタート」を押すとサイドバーで詳細編集
5. 右上の「PDFダウンロード」「CSV出力」「保存」が利用可能

### 自動算出される値

- **導入支援費用**：`(ライセンス月額 + DM月額 + 反響対応月額) × 2.5`
  サイドバーで手動編集すると以後その値を維持
- **税込合計**：`小計 + floor(小計 × 税率)`

詳細は [`logic.html`](logic.html) を参照。

### 出力ファイル名

`【顧客名御中】WHERE利用費見積書.pdf`（CSV も同様）

## 配布方法

### A. ブラウザで開くだけ（最小構成）

ZIP を配布。受け取った人は展開して `WHERE 見積書メーカー.html` をダブルクリックで起動。
Google Fonts と CDN（React / Babel / html2pdf.js）の取得にネット接続が必要。

### B. GitHub Pages でホスティング（推奨）

```bash
# このリポジトリを GitHub にプッシュ
git remote add origin git@github.com:YOUR_ORG/WHERE_Estimate_Maker.git
git push -u origin main

# Settings → Pages → main / root を有効化
```

公開URL: `https://YOUR_ORG.github.io/WHERE_Estimate_Maker/WHERE%20見積書メーカー.html`

GitHub Pages にデプロイすると `variables.json` も同じドメインから配信されるため
fetch が成功し、変数の更新がページリロードで全ユーザーに反映される。

## Gmail 拡張のセットアップ

### 1. OAuth クライアントID の発行（Drive 連携を使う場合）

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. 「APIとサービス → 認証情報 → OAuth 2.0 クライアントID」で **Chrome 拡張機能** を選択
3. アプリケーション ID は後で拡張をロードした後に判明する Chrome の Extension ID
4. 発行されたクライアント ID を `chrome-extension/manifest.json` の
   `oauth2.client_id` に貼り付け
5. Drive API を有効化

### 2. Slack Incoming Webhook の発行（Slack 連携を使う場合）

1. https://api.slack.com/apps → Create New App → From scratch
2. 「Incoming Webhooks」を有効化
3. 「Add New Webhook to Workspace」で投稿先チャンネルを選択
4. 発行された URL を控える

### 3. 拡張機能の読み込み

1. `chrome://extensions/` を開く
2. 右上「デベロッパーモード」をオン
3. 「パッケージ化されていない拡張機能を読み込む」→ `chrome-extension/` を選択
4. 拡張機能のアイコンをクリックして popup を開く
5. 設定欄に：
   - **エディタ URL**：GitHub Pages にデプロイした `WHERE 見積書メーカー.html` の URL
   - **Drive 連携**：チェック + 保存先フォルダ ID（任意）
   - **Slack 連携**：チェック + Webhook URL
6. 「設定を保存」

### 4. 使い方

1. Gmail でメール作成画面を開く
2. ツールバーに「WHERE 見積書を作成」ボタンが表示される
3. クリックすると別ウィンドウで見積書メーカーが起動
4. 起動モーダルに必要事項を入力 → 編集
5. 「完了 → メールに添付」ボタンを押すと：
   - メール作成画面に PDF が自動添付
   - 設定済みなら Drive にも保存
   - 設定済みなら Slack に通知

## 変数の修正・履歴・ロールバック

### 修正手順

```bash
# 1. ブランチ作成
git checkout -b update-variables

# 2. variables.json を編集
#    例: スタンダードプランの月額を変更

# 3. コミット & PR 作成
git add variables.json
git commit -m "プラン月額を改定"
git push -u origin update-variables
gh pr create
```

GitHub Actions が JSON Schema バリデーションを自動実行する。
PR がマージされると `main` の `variables.json` が更新され、
ページリロード時に全ユーザーに反映される。

### バージョン履歴の確認

```bash
git log --follow variables.json
```

または GitHub の `variables.json` ページで「History」をクリック。

### 任意の時点へロールバック

```bash
# 例: 3 commit 前の状態に戻す
git checkout HEAD~3 -- variables.json
git commit -m "Revert variables.json to <date>"
git push
```

または GitHub の Compare 画面で過去の commit と diff を確認しつつ手動編集。

### スキーマ

`variables.schema.json` で構造を定義。新しいフィールドを追加する場合は
スキーマと `logic.html` の説明、エディタ HTML の `applyVariables` 関数の
3 箇所を併せて更新すること。

## 既知の制約

- **Gmail 添付**：Gmail の DOM 構造変更で添付処理が失敗する可能性がある（content-script.js の
  `attachToCompose` を要メンテ）。失敗時は自動的にダウンロード保存にフォールバック。
- **PDF レンダリング**：日本語フォントは Google Fonts の Noto Sans JP に依存。オフライン環境では
  システムフォントにフォールバックする。
- **OAuth**：Chrome 拡張は Chrome ストア公開 or Workspace 管理者からのインストールが必要に
  なる場合がある（`chrome.identity.getAuthToken` の制限）。

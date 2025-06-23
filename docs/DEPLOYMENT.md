# Cloudflare Pages デプロイメント設定

## 必要な設定

### 1. Cloudflare Pages プロジェクトの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 「Pages」セクションに移動
3. 「Create a project」をクリック
4. 「Connect to Git」を選択（初回のみ）
5. プロジェクト名を `daily-kanji` に設定

### 2. GitHub Secrets の設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加：

#### `CLOUDFLARE_API_TOKEN`
1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)にアクセス
2. 「Create Token」をクリック
3. 「Custom token」を選択
4. 以下の権限を設定：
   - Account: Cloudflare Pages:Edit
   - Zone: Zone:Read (任意のゾーン)
5. トークンを作成してコピー

#### `CLOUDFLARE_ACCOUNT_ID`
1. [Cloudflare Dashboard](https://dash.cloudflare.com/)の右サイドバーから確認
2. または、任意のドメインの Overview ページで確認可能

### 3. ビルド設定

Cloudflare Pages側の設定（自動設定されますが、手動で設定する場合）：

- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

### 4. 環境変数

必要に応じて、Cloudflare Pages の Settings > Environment variables で設定：

```
NODE_VERSION=20
```

## デプロイフロー

1. `main`ブランチへのプッシュ時に自動的にProductionデプロイ
2. Pull Request作成時にPreviewデプロイ
3. デプロイ状況はGitHub ActionsとPull Requestのチェック欄で確認可能

## トラブルシューティング

### ビルドエラーの場合
- GitHub Actionsのログを確認
- ローカルで `npm run build` が成功することを確認

### デプロイエラーの場合
- API TokenとAccount IDが正しく設定されているか確認
- Cloudflare Pagesのプロジェクト名が一致しているか確認

### カスタムドメインの設定
1. Cloudflare Pages プロジェクトの Settings > Custom domains
2. ドメインを追加（例: `kanji.example.com`）
3. DNSレコードが自動的に設定される（Cloudflareで管理されているドメインの場合）
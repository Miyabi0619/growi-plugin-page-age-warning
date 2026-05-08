# growi-plugin-page-age-warning

GROWI のページ本文上部に、作成日または最終更新日からの経過年数に応じた注意メッセージを表示するプラグインです。

Qiita の古い記事に表示される注意喚起のように、長期間更新されていないページを参照するときの見落としを減らすことを目的にしています。

## Features

- 作成日または最終更新日を基準に警告を表示
- 1年以上経過したページと2年以上経過したページで表示を変更
- `/Sidebar` やテンプレートページなど、対象外ページを設定可能
- GROWI のページ遷移に追従して警告を再描画

## Installation

GROWI のプラグイン管理画面から、次のパッケージ名でインストールします。

```text
growi-plugin-page-age-warning
```

このパッケージには npm 検索用の `growi-plugin` キーワードを設定しています。

## Behavior

デフォルトでは、ページの作成日を基準にします。

- 作成から1年未満: 何も表示しません
- 作成から1年以上2年未満: 「1年以上経過」の警告を表示します
- 作成から2年以上: 「2年以上経過」の警告を表示します

日付は GROWI のページ API から取得し、取得できない場合は画面上の表示から読み取ります。

## Configuration

現時点では、設定は `client-entry.tsx` 内の `CONFIG` を編集して変更します。

```ts
const CONFIG = {
  dateField: 'createdAt',
  showFreshMessage: false,
  firstThresholdDays: 365,
  secondThresholdDays: 730,
  ignoredPagePaths: [
    '/',
    '/Sidebar',
  ],
  ignoredPagePathPatterns: [
    /(^|\/)__?Template(\/|$)/,
  ],
};
```

`dateField` を `updatedAt` に変更すると、最終更新日を基準に警告します。

## Development

依存関係をインストールします。

```sh
pnpm install
```

ビルドします。

```sh
pnpm build
```

## Debug

ブラウザのコンソールで次を実行すると、デバッグログを有効にできます。

```js
localStorage.setItem('growi-plugin-page-age-warning:debug', 'true');
```

無効にする場合は次を実行します。

```js
localStorage.removeItem('growi-plugin-page-age-warning:debug');
```

## License

MIT

## 🌐 Language

- [English](./README.md)
- [日本語](./README.ja.md)

# Fortnite Replay Analysis

FortniteのリプレイファイルをNode.jsで解析し、プレイヤーデータを取得・集計・ソートできるモジュールです。

## 特徴

* OS判定でビルド済みの自己完結バイナリを呼び出し、高速に解析できます。
* botプレイヤーの除外や順位ソートのオプションに対応しています。
* 複数マッチのスコアをパーティ単位でマージして集計できます。
* 公式準拠のルールでスコアをソートできます。

## インストール

```bash
npm install fortnite-replay-analysis@latest
```

## 使い方

以下は、1試合のリプレイ解析からスコア計算、複数マッチのマージまでを実行する例です。

```js
const {
    ReplayAnalysis,
    calculateScore,
    sortScores,
    mergeScores
} = require('fortnite-replay-analysis');

(async () => {
    // リプレイ解析（ディレクトリ指定時は最初に見つけた .replay を処理、ファイル指定時はそのファイルを使用）
    const {
        rawReplayData,
        rawPlayerData,
        processedPlayerInfo
    } = await ReplayAnalysis(
        './path/to/replayDirOrFile',
        { bot: false, sort: true }
    );

    console.log('Raw Data:', rawPlayerData);
    console.log('Processed Player Info:', processedPlayerInfo);

    // 公式ルールでソート
    const sortedScores = sortScores(processedPlayerInfo);

    // ポイント＆キル計算
    const score = await calculateScore({
        matchData: processedPlayerInfo,
        points: { 1: 11, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2 },
        killCountUpperLimit: 10,      // 省略可能、デフォルト null（無制限）
        killPointMultiplier: 1        // 1撃破あたりの倍率（1の場合1撃破1pt, 2の場合1撃破2ポイント）、省略可能、デフォルト 1
    });

    console.log('Score:', score);

    // 複数マッチのマージと再ソート
    const merged = mergeScores([ sortedScores, sortedScores2 ]);
    const finalSorted = sortScores(merged);

    console.log('Merged & Sorted:', finalSorted);
})();
```

## API

### `ReplayAnalysis(inputPath, options)`

* `inputPath`: .replayファイルがあるディレクトリまたはファイルのパス
* `options`（省略可）:

  * `bot`（boolean）: botプレイヤーを含めるか（デフォルト: `false`）
  * `sort`（boolean）: 順位でソートするか（デフォルト: `true`）
* 戻り値: Promise<{
  rawReplayData: Object,
  rawPlayerData: Array,
  processedPlayerInfo: Array
  }>

### `calculateScore({ matchData, points, killCountUpperLimit, killPointMultiplier })`

* `matchData`: `ReplayAnalysis`の`processedPlayerInfo`配列、またはそのJSONファイルへのパス
* `points`: 順位ごとのポイント設定オブジェクト（例: `{1:11,2:6,...}`）
* `killCountUpperLimit`: キル数の上限（省略可能、デフォルト: `null` で無制限）
* `killPointMultiplier`: 1撃破あたりの倍率（1の場合1撃破1pt, 2の場合1撃破2ポイント）、省略可能、デフォルト: `1`
* 戻り値: Promise（パーティごとの集計結果）

### `sortScores(scoreArray)`

* 公式準拠のルールでスコアをソートして返します。
* 引数: `calculateScore`や`mergeScores`の戻り値として得られる配列
* ソート順:

  1. 累計ポイント降順
  2. Victory Royale 回数降順
  3. 平均撃破数降順
  4. 平均順位昇順
  5. 合計生存時間降順
  6. 最初のパーティ番号昇順

### `mergeScores(scoreArrays)`

* 複数マッチ分のスコア配列をパーティ単位でマージします。
* 引数: ソート済みスコア配列の配列（例: `[sorted1, sorted2, ...]`）
* 戻り値: マージ後のスコア配列

## 注意事項

* ディレクトリ指定時は最初に見つけた `.replay` を処理します。
* 直接ファイルを指定した場合はそのファイルを処理し、`.replay` が存在しない場合でも最初に見つけたものを使用します。
* 本ツールの利用により発生した問題について、開発者は一切の責任を負いません。
* フォークする場合は、GitHub の「Fork」機能を利用してください（clone → 新規リポジトリ作成は非推奨です）。

## 🔗 使用ライブラリ

このプロジェクトは以下のオープンソースライブラリを使用しています：

- [FortniteReplayDecompressor](https://github.com/Shiqan/FortniteReplayDecompressor)  
  © Shiqan — 本プロジェクトは MIT ライセンスのもとで利用しています。
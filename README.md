# Fortnite Replay Analysis

Fortniteのリプレイファイルを解析して、プレイヤーデータを取得・集計・ソートできるNode.jsのモジュールです。

## 特徴

* OS判定してC#でビルドされた自己完結バイナリを呼び出すから、高速解析できる
* botプレイヤーの除外や順位ソートなどオプション対応
* 複数マッチのスコアをパーティ単位でマージして集計可能
* 公式準拠でのスコアのソートも可能

## インストール

```
npm install fortnite-replay-analysis@latest
```

## 使い方

```js
const { ReplayAnalysis, mergeScores, sortScores, calculateScore } = require('fortnite-replay-analysis');

(async () => {
  try {
    // 1試合分のリプレイ解析（返り値はJSON形式）
    // rawPlayerData: 元の解析結果、生データ
    // processedPlayerInfo: bot除外や順位ソート済みのプレイヤーデータ
    const { rawReplayData, rawPlayerData, processedPlayerInfo } = await ReplayAnalysis('./path/to/replayDir', { bot: false, sort: true });

    console.log('Raw Data:', rawPlayerData);
    console.log('Processed Player Info:', processedPlayerInfo);

    // 解析結果のスコア配列を公式準拠のルールでソートも可能
    const sortedScores = sortScores(processedPlayerInfo);

    // 複数マッチの解析結果をまとめたいときは、
    // sortScoresでソート済みの配列を複数用意して
    // mergeScoresに配列の配列として渡す
    const mergedScores = mergeScores([
      sortedScores,    // 1試合目の結果
      sortedScores2,   // 2試合目の結果
      // ...
    ]);

    // マージ後の結果もsortScoresで再ソート可能
    const finalSorted = sortScores(mergedScores);

    console.log('Merged and Sorted:', finalSorted);

  } catch (e) {
    console.error(e);
  }
})();
```

## calculateScoreの使い方

リプレイ解析済みの`ReplayAnalysis` の `result.processedPlayerInfo` を保存した JSON ファイル（ファイル名は任意でOK）から、大会形式のスコアを計算したいときに使える。

```js
const { calculateScore } = require('fortnite-replay-analysis');

const score = await calculateScore({
  matchDataPath: './output/matchA1/playerInfo.json',
  points: {
    1: 11, 2: 6, 3: 5, 4: 4, 5: 3,
    6: 2, 7: 1, 8: 1, 9: 1, 10: 1
  },
  killPointMultiplier: 1,
  killCountUpperLimit: 10
});

console.log(score);
```

## API

### `ReplayAnalysis(replayFileDir, options)`

* `replayFileDir`：リプレイファイルが入ったディレクトリのパス
* `options`：

  * `bot`（boolean）：botプレイヤーを結果に含めるか（デフォルトfalse）
  * `sort`（boolean）：順位でソートするか（デフォルトtrue）
* 返り値はPromiseで、`rawPlayerData`と`processedPlayerInfo`を含むオブジェクトを返す

### `mergeScores(scoreArrays)`

* 複数マッチのスコア配列をパーティ単位でマージする
* 返り値はマージされたスコア配列

### `sortScores(scoreArray)`

* 公式準拠のルールでスコアをソートする
* 引数はマージ済みのスコア配列

### `calculateScore({ matchDataPath, points, killCountUpperLimit, killPointMultiplier })`

* `matchDataPath`：`ReplayAnalysis` の `result.processedPlayerInfo` を保存した JSON ファイルのパス（ファイル名は任意でOK）
* `points`：順位に対するポイント設定（例：{ 1: 11, 2: 6, ... }）
* `killCountUpperLimit`：キル数制限（nullで無制限）
* `killPointMultiplier`：キル数倍率（例：1なら1キル1ポイント、2なら1キル2ポイント）

## 動作環境

* Node.js v22以上
* Windows / Linux対応（Macは未対応）
* C#で作られた自己完結バイナリが`CSproj/bin/Release/net8.0/`配下に同補されていること

## 注意事項

* リプレイファイルはディレクトリに1つ以上`.replay`ファイルが必要
* ディレクトリ内に複数ファイルある場合は現状最初の1つのみ処理される
* 何か問題起こっても俺は責任追わない
* このリポジトリをフォークする際は、GitHubの「Fork」ボタンからフォークしてください。
git cloneして新しく別リポジトリを作るのではなく、GitHub上のフォーク機能を使っていただけると、変更履歴を正しく追えます。
ご協力よろしくお願いします！

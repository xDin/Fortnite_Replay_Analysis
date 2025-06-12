# Fortnite Replay Analysis

Fortniteの `.replay` ファイルを解析して、試合中のプレイヤー情報やパーティごとの統計データを取得できるNode.jsモジュールです。

## 特徴

* クロスプラットフォーム対応（Windows / Linux）
* .NET製CLIバイナリとNode.jsで連携
* Decimal.jsで高精度な生存時間計算
* スコア集計、C6S3公式準拠の並び替え機能付き

## インストール

```bash
npm install fortnite-replay-analysis
```

## 使用例

```js
const { ReplayAnalysis, sortScores, mergeScores } = require('fortnite-replay-analysis');

// リプレイファイルのパスを指定して解析
ReplayAnalysis('./match1.replay').then(({ processedPlayerInfo }) => {
    console.log(processedPlayerInfo);
});
```

## 関数一覧

### `ReplayAnalysis(replayFilePath: string, options?: { bot?: boolean, sort?: boolean }): Promise<{ rawPlayerData, processedPlayerInfo }>`

* `.replay` ファイルを解析して、プレイヤーごとの詳細情報を取得
* `bot`: Botプレイヤーを含めるかどうか（デフォルト: `false`）
* `sort`: 順位でソートするか（デフォルト: `true`）

### `mergeScores(scoreArrays: ProcessedMatch[][]): MergedPartyResult[]`

* 複数のマッチを統合してパーティ単位の統計を作成

### `sortScores(partyResults: MergedPartyResult[]): MergedPartyResult[]`

* Fortnite公式基準でスコア順にソート（スコア → VictoryRoyale数 → 平均キル → 平均順位 → 生存時間）

## 開発者向け

* このパッケージは自己完結型の.NETバイナリを含みます（OSにより異なる）
* 実行にはNode.js v22以上を推奨

## ライセンス

MIT License

## リポジトリ

[https://github.com/yuyutti/Fortnite_Replay_Analysis](https://github.com/yuyutti/Fortnite_Replay_Analysis)

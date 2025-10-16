## 🌐 Language

- [English](./README.md)
- [日本語](./README.ja.md)

# Fortnite Replay Analysis

Fortnite Replay Analysis is a Node.js module for reading Fortnite replay files, extracting player data, and ranking results.

## Features

* Detects the operating system and invokes a prebuilt, self-contained binary for fast parsing.
* Supports excluding bot players and optional placement sorting.
* Merges scores across multiple matches by party.
* Sorts scores following the official Fortnite scoring rules.

## Installation

```bash
npm install fortnite-replay-analysis@latest
```

## Usage

```js
    const {
        ReplayAnalysis,
        calculateScore,
        sortScores,
        mergeScores
    } = require('fortnite-replay-analysis');

    (async () => {
        // Parse a single match (directory: first .replay file; file: specific .replay)
        const {
            rawReplayData,
            rawPlayerData,
            processedPlayerInfo
        } = await ReplayAnalysis(
            './path/to/replayDirOrFile',
            { bot: false, sort: true, dumpPath: './replay_dump.json' }
        );

        console.log('Raw Data:', rawPlayerData);
        console.log('Processed Player Info:', processedPlayerInfo);

        // Sort by official rules
        const sortedScores = sortScores(processedPlayerInfo);

        // Calculate points & kills
        const score = await calculateScore({
            matchData: processedPlayerInfo,
            points: { 1: 11, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2 },
            killCountUpperLimit: 10,      // optional, default null (no limit)
            killPointMultiplier: 1        // points per kill multiplier, optional, default 1
        });

        console.log('Score:', score);

        // Merge and re-sort multiple matches
        const merged = mergeScores([sortedScores, sortedScores2]);
        const finalSorted = sortScores(merged);

        console.log('Merged & Sorted:', finalSorted);
    })();
```

## API

### `ReplayAnalysis(inputPath, options)`

* `inputPath`: Path to a directory or a `.replay` file.
* `options` (optional):

  * `bot` (boolean): Include bot players (default: `false`).
  * `sort` (boolean): Sort by placement (default: `true`).
  * `dumpPath` (string): Write the complete parsed replay JSON to this file path (optional).
* Returns: `Promise<{ rawReplayData: Object, rawPlayerData: Array, processedPlayerInfo: Array }>`

### `calculateScore({ matchData, points, killCountUpperLimit, killPointMultiplier })`

* `matchData`: The `processedPlayerInfo` array from `ReplayAnalysis`, or a path to its JSON file.
* `points`: Object mapping placement to points (e.g., `{1:11,2:6,...}`).
* `killCountUpperLimit`: Upper limit for kills (optional, default `null` for unlimited).
* `killPointMultiplier`: Points multiplier per kill (optional, default `1`).
* Returns: `Promise<Array>` of aggregated results per party.

### `sortScores(scoreArray)`

Sorts scores according to official Fortnite rules:

1. Total points (descending)
2. Victory Royale count (descending)
3. Average kills (descending)
4. Average placement (ascending)
5. Total survival time (descending)
6. First party number (ascending)

### `mergeScores(scoreArrays)`

* Merges multiple sorted score arrays by party.
* `scoreArrays`: Array of sorted score arrays (e.g., `[sorted1, sorted2, ...]`).
* Returns: Merged score array.
* ※When using `mergeScores`, ensure each entry includes a `matchName` property. Omitting this field may lead to unexpected behavior.

```javascript
    function loadScores(matchNames) {
        return matchNames.map(name => {
            const raw = fs.readFileSync(
                path.join(outputDir, name, `${name}.json`),
                'utf8'
            );
            const arr = JSON.parse(raw);
            return arr.map(p => ({ ...p, matchName: name })); // 各マッチデータに対してマッチ名を追加
        });
    }

    (async () => {
        const scores = loadScores(['match1','match2']);
        let merged = mergeScores(scores);
        merged = sortScores(merged);
    })();
```

## Notes

* When a directory is provided, the first `.replay` file found will be processed.
* When a file is specified, that file will be processed; if no `.replay` is found, the first one in the directory is used.
* This software is provided without any warranty. Use it at your own risk.
* When forking this repository, please use GitHub’s "Fork" feature to retain commit history.
* I’m not very good at English, so the translation might be incorrect.

## 🔗 Acknowledgements

This project uses the following open-source library:

- [FortniteReplayDecompressor](https://github.com/Shiqan/FortniteReplayDecompressor)  
  © Shiqan — Licensed under the MIT License.
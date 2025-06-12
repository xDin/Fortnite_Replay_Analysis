const os = require('os');
const fs = require('fs');
const path = require('path');
const Decimal = require('decimal.js');
const { execFile } = require('child_process');

function getBinaryPath() { // OS判定して自己完結バイナリの実行ファイルパスを返す
    const baseDir = path.resolve(__dirname, 'CSproj', 'bin', 'Release', 'net8.0');

    switch (os.platform()) {
        case 'win32':
            return path.join(baseDir, 'win-x64', 'publish', 'FortniteReplayAnalysis.exe');
        case 'linux':
            return path.join(baseDir, 'linux-x64', 'publish', 'FortniteReplayAnalysis');
        default:
            throw new Error(`Unsupported platform: ${os.platform()}`);
    }
}

function ReplayAnalysis(replayFileDir, { bot = false, sort = true } = {}) { // Fortniteのリプレイファイルを解析してプレイヤーデータを返す
    return new Promise((resolve, reject) => {

        let replayFiles;
        try {
            replayFiles = fs.readdirSync(replayFileDir).filter(f => f.endsWith('.replay'));
        } catch (e) {
            reject(new Error(`Failed to read directory: ${e.message}`));
            return;
        }

        if (replayFiles.length === 0) {
            reject(new Error(`No replay file found in directory: ${replayFileDir}`));
            return;
        }

        // とりあえず1個目のファイルを処理（複数ある場合は要拡張）
        const replayFilePath = path.join(replayFileDir, replayFiles[0]);
        const binPath = getBinaryPath();

        execFile(binPath, [replayFilePath], (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Execution error: ${error.message}`));
                return;
            }
            if (stderr) {
                console.warn(`Warning: ${stderr}`);
            }

            try {
                const playerData = JSON.parse(stdout);

                if (!Array.isArray(playerData)) {
                    reject(new Error(`Unexpected JSON format: playerData is not an array.`));
                    return;
                }

                // 2位以下のDeathTimeDoubleを取得
                const secondPlaceAliveTimes = playerData
                    .filter(p => p.Placement !== 1)
                    .map(p => p.DeathTimeDouble)
                    .filter(t => t !== null && t !== undefined);

                // 2位がいなかったら0秒にする（または適宜）
                const maxSecondPlaceAliveTime = secondPlaceAliveTimes.length > 0
                    ? secondPlaceAliveTimes
                        .map(t => new Decimal(t))
                        .reduce((a, b) => Decimal.max(a, b))
                    : new Decimal(0);

                const playerInfo = playerData.map(player => {
                    const aliveTimeDecimal = player.DeathTimeDouble === null
                        ? maxSecondPlaceAliveTime.plus(new Decimal('1e-9'))
                        : new Decimal(player.DeathTimeDouble);

                    return {
                        partyNumber: player.TeamIndex,
                        Placement: player.Placement,
                        Kills: player.Kills,
                        TeamKills: player.TeamKills,
                        aliveTime: aliveTimeDecimal,
                        EpicId: player.EpicId,
                        PlayerName: player.PlayerName,
                        Platform: player.Platform,
                        IsBot: player.IsBot
                    };
                });

                let filteredAndSortedPlayerInfo = playerInfo;
                if (!bot) {
                    filteredAndSortedPlayerInfo = filteredAndSortedPlayerInfo.filter(p => p.IsBot === false);
                }
                if (sort) {
                    filteredAndSortedPlayerInfo = filteredAndSortedPlayerInfo.sort((a, b) => a.Placement - b.Placement);
                }

                resolve({
                    rawPlayerData: playerData, processedPlayerInfo: filteredAndSortedPlayerInfo,
                });
            } catch (jsonErr) {
                reject(new Error(`JSON parse error: ${jsonErr.message}`));
            }
        });
    });
}

function mergeScores(scoreArrays) { // 複数マッチの結果をマージしてパーティごとに集計
    const map = new Map();
    scoreArrays.forEach(scores =>
        scores.forEach(p => {
            const key = JSON.stringify([...p.partyMemberIdList].sort());
            if (!map.has(key)) {
                map.set(key, {
                    partyPlacement: null,
                    partyNumber: p.partyNumber,
                    partyScore: p.partyScore,
                    partyPoint: p.partyPoint,
                    partyKills: p.partyKills,
                    partyMemberList: [...p.partyMemberList],
                    matchList: [p.matchName],
                    partyVictoryRoyaleCount: p.partyVictoryRoyale ? 1 : 0,
                    partyAliveTimeByMatch: [
                        { match: p.matchName, times: [...(p.partyAliveTimeList || [])] }
                    ],
                    partyPlacementList: [p.partyPlacement]
                });
            } else {
                const ex = map.get(key);
                ex.matchList.push(p.matchName);
                ex.partyScore              += p.partyScore;
                ex.partyKills              += p.partyKills;
                ex.partyPoint              += p.partyPoint;
                ex.partyVictoryRoyaleCount += p.partyVictoryRoyale ? 1 : 0;
                ex.partyAliveTimeByMatch.push({
                    match: p.matchName,
                    times: [...(p.partyAliveTimeList || [])]
                });
                ex.partyPlacementList.push(p.partyPlacement);
            }
        })
    );
    
    return Array.from(map.values()).map(p => ({
        ...p,
        partyPlacement: p.partyPlacementList.reduce((a, b) => a + b, 0) / p.partyPlacementList.length
    }));
}

function sortScores(arr) { // 公式準拠のスコアソート関数
    // リザルトとしてpoint, ビクロイ数, マッチ数, 平均撃破数, 平均順位, 合計生存時間を追加したい
    if (!Array.isArray(arr) || arr.length === 0) return arr;

    arr.forEach(p => {
        const matchCount = (p.partyPlacementList || []).filter((placement, i, arr) =>
            placement === 1 && p.partyNumber === (arr[i] || {}).partyNumber
        ).length || 1;
        p.result = {
            point: p.partyScore || 0,
            victoryCount: p.partyVictoryRoyaleCount ?? (p.partyVictoryRoyale ? 1 : 0),
            matchCount,
            avgKills: (p.partyKills || 0) / matchCount,
            avgPlacement: (p.partyPlacementList && p.partyPlacementList.length > 0)
                ? (p.partyPlacementList.reduce((s, x) => s + x, 0) / p.partyPlacementList.length)
                : p.partyPlacement,
            totalAliveTime: sumMaxAliveTime(p.partyAliveTimeList, p.partyAliveTimeByMatch),
        };
    });

    return arr.sort((a, b) => {
        // 1. 累計獲得ポイント
        if (b.result.point !== a.result.point) {
            return b.result.point - a.result.point;
        }
        // 2. セッション中の累計 Victory Royale 回数
        if (b.result.victoryCount !== a.result.victoryCount) {
            return b.result.victoryCount - a.result.victoryCount;
        }

        // 3. 平均撃破数
        if (b.result.avgKills !== a.result.avgKills) {
            return b.result.avgKills - a.result.avgKills;
        }

        // 4. 平均順位（小さいほうが上位）
        if (b.result.avgPlacement !== a.result.avgPlacement) {
            return b.result.avgPlacement - a.result.avgPlacement;
        }

        // 5. 全マッチの合計生存時間
        const cmp = b.result.totalAliveTime.comparedTo(a.result.totalAliveTime);
        if (cmp !== 0) return cmp;

        // 6. 最終手段：1マッチ目のパーティ番号が小さい順
        return a.partyNumber - b.partyNumber;
    });
}

function sumMaxAliveTime(partyAliveTimeList, partyAliveTimeByMatch) {
    if (Array.isArray(partyAliveTimeByMatch) && partyAliveTimeByMatch.length > 0) {
        // 複数マッチ分の最大値を足す処理
        return partyAliveTimeByMatch.reduce((sum, match) => {
            if (!Array.isArray(match.times) || match.times.length === 0) return sum;
            const maxTime = match.times.reduce(
                (max, t) => {
                    const timeDec = new Decimal(t);
                    return timeDec.greaterThan(max) ? timeDec : max;
                },
                new Decimal(0)
            );
            return sum.plus(maxTime);
        }, new Decimal(0));
    }

    // こっちは単一マッチ用。配列の最大値返すだけ
    if (Array.isArray(partyAliveTimeList) && partyAliveTimeList.length > 0) {
        const maxVal = partyAliveTimeList.reduce(
            (max, t) => {
                const timeDec = new Decimal(t);
                return timeDec.greaterThan(max) ? timeDec : max;
            },
            new Decimal(0)
        );
        return maxVal;
    }

    return new Decimal(0);
}

module.exports = {
    ReplayAnalysis,
    sortScores,
    mergeScores
};
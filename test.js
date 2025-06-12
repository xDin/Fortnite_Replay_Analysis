const path = require('path');
const fs = require('fs');
const { ReplayAnalysis } = require('./index.js');

(async () => {
    try {
        const replayFilePath = path.resolve(__dirname, 'replay', 'conoma-custam.replay'); // 実際のreplayファイルパス
        const result = await ReplayAnalysis(replayFilePath, { bot: true, sort: true });
        // jsoutputフォルダに出力
        const outputDir = path.join(__dirname, 'jsoutput');
        fs.mkdirSync(outputDir, { recursive: true });
        const rawPath = path.join(outputDir, 'rawPlayerData.json');
        const processedPath = path.join(outputDir, 'processedPlayerInfo.json');

        fs.writeFileSync(rawPath, JSON.stringify(result.rawPlayerData, null, 4), 'utf8');
        fs.writeFileSync(processedPath, JSON.stringify(result.processedPlayerInfo, null, 4), 'utf8');

    } catch (error) {
        console.error('エラー:', error);
    }
})();
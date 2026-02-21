const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * THEA'S SURGICAL INSERTION ENGINE v1.0
 * 功能：像人類一樣，只在試算表末尾「追加」新行，不觸碰現有數據。
 */

const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const MISSION_MD_PATH = '/Users/cook/projects/twilight_wars_wiki/docs/missions/skydow/seasons2/龍魅奇謀.md';

const formatText = (text) => {
    return text.split('\n')
        .map(line => line.replace(/^[ 　]+/g, '').trim())
        .filter(line => line !== "")
        .join('\n\n');
};

async function appendDragonData() {
    console.log("正在嘗試「追加」龍魅奇謀資料至試算表 (不覆寫現有內容)...");

    const auth = new google.auth.GoogleAuth({
        keyFile: CREDS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 1. 從 Wiki 提取資料
    const content = fs.readFileSync(MISSION_MD_PATH, 'utf8');
    const dragonIntro = formatText(content.split('## 龍魅奇謀')[1].split('---')[0]);
    const dragonMissions = [];
    content.split(/^###\s+/gm).slice(1).forEach(section => {
        const lines = section.split('\n');
        const title = lines[0].trim();
        if (title.includes('資料來源')) return;
        dragonMissions.push({ 
            title, 
            desc: formatText(lines.slice(1).join('\n').split('---')[0]) 
        });
    });

    // 2. 追加到「章節資訊」 (A:紀錄, B:代碼, C:陣營, D:Seasons, E:Chapters, F:簡介)
    const chapterData = [[
        false, 
        "skydow_seasons2_龍魅奇謀", 
        "skydow", 
        "第二部 - 屠魔英雄", 
        "龍魅奇謀", 
        dragonIntro
    ]];
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: '章節資訊!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: chapterData }
    });
    console.log("- 章節資訊追加成功");

    // 3. 追加到「任務資訊」 (A:紀錄, B:代碼, C:陣營, D:章節代碼, E:任務名, F:敘述, G:開啟, H:過關, I:失敗, J:詳細, K:地圖, L:參考)
    const missionData = dragonMissions.map(m => [
        false,
        `skydow_seasons2_龍魅奇謀_${m.title}`.toLowerCase().replace(/\s+/g, '_'),
        "skydow",
        "skydow_seasons2_龍魅奇謀",
        m.title,
        m.desc,
        "", // 開啟
        "", // 過關
        "", // 失敗
        "", // 詳細
        "", // 地圖
        "1" // 參考
    ]);
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: '任務資訊!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: missionData }
    });
    console.log("- 任務資訊追加成功");

    // 4. 最後單獨修復新追加行的 Checkbox UI
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const missionSheetId = spreadsheet.data.sheets.find(s => s.properties.title === '任務資訊').properties.sheetId;
    const chapterSheetId = spreadsheet.data.sheets.find(s => s.properties.title === '章節資訊').properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: [
            { setDataValidation: { range: { sheetId: missionSheetId, startRowIndex: 0, endRowIndex: 200, startColumnIndex: 0, endColumnIndex: 1 }, rule: { condition: { type: "BOOLEAN" }, showCustomUi: true } } },
            { setDataValidation: { range: { sheetId: chapterSheetId, startRowIndex: 0, endRowIndex: 100, startColumnIndex: 0, endColumnIndex: 1 }, rule: { condition: { type: "BOOLEAN" }, showCustomUi: true } } }
        ]}
    });

    console.log("追加完成。");
}

appendDragonData().catch(console.error);

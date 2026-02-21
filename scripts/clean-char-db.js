const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * THEA'S DATABASE CLEANER v1.0
 * 1. 將「角色資訊」中的「登場任務 (ID串)」欄位去語法化。
 * 2. 移除所有 [名稱](連結) 格式，僅保留純名稱。
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');

async function cleanCharacterMissions() {
    console.log("正在執行資料庫去語法化：清理角色登場任務欄位...");

    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    // 1. 獲取角色資訊 (I 欄是「登場任務 (ID串)」)
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '角色資訊!A1:I500',
    });

    const rows = res.data.values;
    if (!rows) return;

    const updatedRows = rows.map((row, idx) => {
        if (idx === 0) return [row[8]]; // 標題欄
        let val = row[8] || "";
        if (val.includes('](')) {
            // 使用正則提取 [名稱]
            const matches = val.match(/\[(.+?)\]/g);
            if (matches) {
                val = matches.map(m => m.slice(1, -1)).join('、');
            }
        }
        return [val];
    });

    // 2. 寫回 I 欄
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '角色資訊!I1:I' + rows.length,
        valueInputOption: 'RAW',
        resource: { values: updatedRows }
    });

    console.log("資料庫去語法化完成。");
}

cleanCharacterMissions().catch(console.error);

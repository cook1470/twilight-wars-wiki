const { google } = require('googleapis');
const path = require('path');

/**
 * 💋 THEA'S REFERENCE REPAIR PROTOTYPE
 * 功能：讀取角色資訊與參考資料庫，進行 Index 修復與名稱抓取。
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, 'credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function inspectReferences() {
    const sheets = await getSheetsClient();
    
    // 1. 讀取角色資訊
    const charRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:Z500'
    });
    const charRows = charRes.data.values;
    if (!charRows) return;

    const charHeaders = charRows[0];
    const indexCol = charHeaders.indexOf('參考資料 (Index)');
    const nameCol = charHeaders.indexOf('參考資料 (名稱)');
    const idCol = charHeaders.indexOf('ID');

    console.log('--- 角色資訊 (Index 異常檢查) ---');
    charRows.slice(1).forEach(row => {
        const indexVal = row[indexCol];
        const charId = row[idCol];
        // 檢查是否被轉換成日期 (通常包含 / 或 - 且看起來像日期的格式)
        // 或者長度異常
        if (indexVal && (indexVal.includes('/') || indexVal.includes('-') || !isNaN(Date.parse(indexVal)))) {
            console.log(`[!] 異常: ${charId} -> Index: ${indexVal}`);
        }
    });

    // 2. 讀取參考資料庫
    const refRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '參考資料庫!A1:C500'
    });
    const refRows = refRes.data.values;
    if (!refRows) {
        console.log('無法讀取參考資料庫。');
        return;
    }
    
    console.log('\n--- 參考資料庫 內容 ---');
    console.log(refRows[0].join(' | '));
    refRows.slice(1, 10).forEach(row => console.log(row.join(' | ')));
}

inspectReferences().catch(console.error);

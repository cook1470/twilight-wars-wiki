const { google } = require('googleapis');
const path = require('path');

/**
 * THEA'S UI REPAIR ENGINE v3.0
 * 1. 將「紀錄完成」欄位從字串轉回布林值。
 * 2. 強制恢復 Checkbox UI。
 * 3. 適用於 角色、任務、章節 所有分頁。
 */

const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function repairAllCheckboxes() {
    console.log("🚀 開始全面修復複選框 UI...");
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const targetSheets = ['角色資訊', '任務資訊', '章節資訊'];

    for (const name of targetSheets) {
        console.log(`正在修復分頁: ${name}`);
        const response = await sheets.spreadsheets.values.get({ 
            spreadsheetId: SPREADSHEET_ID, 
            range: `${name}!A1:A500` 
        });
        const rows = response.data.values;
        if (!rows) continue;

        // 1. 轉換資料：字串 -> 布林
        const updatedValues = rows.map((row, idx) => {
            if (idx === 0) return [row[0]];
            const val = String(row[0]).trim().toUpperCase();
            return [val === 'TRUE']; // 強制轉為布林值
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID, 
            range: `${name}!A1`,
            valueInputOption: 'USER_ENTERED', // 使用 USER_ENTERED 讓 Sheets 識別布林
            resource: { values: updatedValues }
        });

        // 2. 強制施加資料驗證 (Checkbox)
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === name).properties.sheetId;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    setDataValidation: {
                        range: { sheetId, startRowIndex: 1, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: 1 },
                        rule: { condition: { type: "BOOLEAN" }, showCustomUi: true }
                    }
                }]
            }
        });
    }
    console.log("✅ 所有分頁的複選框已恢復正常。");
}

repairAllCheckboxes().catch(console.error);

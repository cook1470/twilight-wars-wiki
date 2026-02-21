const { google } = require('googleapis');
const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function manualFixMissions() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log("開始執行任務資訊分頁純手工重構...");

    // 1. 準備正確的 12 欄位標頭
    const MISSION_HEADERS = ['紀錄完成', '任務代碼', '陣營', '章節代碼', '任務名稱', '任務敘述', '開啟條件', '過關條件', '失敗條件', '詳細頁面內容 (Markdown)', '地圖代碼', '參考資料 (Index)'];
    
    // 2. 獲取當前試算表數據 (A 到 L 欄)
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '任務資訊!A2:L200' });
    const rawRows = res.data.values || [];

    const finalRows = [MISSION_HEADERS];
    rawRows.forEach(row => {
        const isDone = (String(row[0]).trim().toUpperCase() === 'TRUE');
        // 對齊映射：
        // 0:紀錄, 1:代碼, 2:陣營, 3:章節代碼, 4:名稱, 5:敘述, 6:開啟, 7:過關, 8:失敗, 9:詳細, 10:地圖, 11:參考
        finalRows.push([
            isDone, 
            row[1] || "", row[2] || "", row[3] || "", row[4] || "", 
            row[5] || "", row[6] || "", row[7] || "", row[8] || "", 
            row[9] || "", row[10] || "", row[11] || ""
        ]);
    });

    // 3. 覆寫並重設 UI
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: '任務資訊!A1:Z1000' });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '任務資訊!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: finalRows }
    });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === '任務資訊').properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: [
            { unmergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 20 } } },
            { setDataValidation: { range: { sheetId, startRowIndex: 1, endRowIndex: finalRows.length, startColumnIndex: 0, endColumnIndex: 1 }, rule: { condition: { type: "BOOLEAN" }, showCustomUi: true } } },
            { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 5 }, cell: { userEnteredFormat: { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" } }, fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)" } }
        ]}
    });

    console.log("任務資訊重構完成。");
}

manualFixMissions().catch(console.error);

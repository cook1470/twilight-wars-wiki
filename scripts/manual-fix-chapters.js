const { google } = require('googleapis');
const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function manualRestructure() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log("開始執行章節資訊分頁純手工重構...");

    // 1. 準備正確的標頭與資料 (7 欄位規格)
    const CHAPTER_HEADERS = ['紀錄完成', '章節代碼', '陣營', '季度', '章節名稱', '章節簡介', '開啟條件'];
    
    // 2. 獲取當前試算表所有資料 (包含被推擠到 G 欄的內容)
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '章節資訊!A2:G50' });
    const rawRows = res.data.values || [];

    const finalRows = [CHAPTER_HEADERS];
    rawRows.forEach(row => {
        // 修正邏輯：將原本在 G 欄 (Index 6) 或 F 欄 (Index 5) 的資料重新歸位
        // 原始 Row 21 (黑色追殺令) 的開啟條件就在 Index 6
        const isDone = (String(row[0]).trim().toUpperCase() === 'TRUE');
        const code = row[1] || "";
        const faction = row[2] || "";
        const season = row[3] || "";
        const name = row[4] || "";
        let intro = row[5] || "";
        let open = row[6] || "";

        // 如果簡介裡還殘留開啟條件文字，移動它
        if (intro.includes('（註：此章節通常需在完成「情份」分歧後開啟）')) {
            open = "完成「情份」分歧後開啟";
            intro = intro.replace('（註：此章節通常需在完成「情份」分歧後開啟）', '').trim();
        }

        finalRows.push([isDone, code, faction, season, name, intro, open]);
    });

    // 3. 徹底清空並覆寫
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: '章節資訊!A1:Z100' });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '章節資訊!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: finalRows }
    });

    // 4. 修復 UI (複選框與對齊)
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === '章節資訊').properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: [
            { unmergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 100, startColumnIndex: 0, endColumnIndex: 10 } } },
            { setDataValidation: { range: { sheetId, startRowIndex: 1, endRowIndex: finalRows.length, startColumnIndex: 0, endColumnIndex: 1 }, rule: { condition: { type: "BOOLEAN" }, showCustomUi: true } } },
            { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 100, startColumnIndex: 0, endColumnIndex: 5 }, cell: { userEnteredFormat: { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" } }, fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)" } },
            { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 500 }, fields: 'pixelSize' } },
            { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } }
        ]}
    });

    console.log("章節資訊重構完成。");
}

manualRestructure().catch(console.error);

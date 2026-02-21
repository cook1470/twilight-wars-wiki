const { google } = require('googleapis');
const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

/**
 * THEA'S TRUTH ARRAY ENGINE v1.0
 * 1. 將「任務資訊」中的過關條件、失敗條件進行「陣列化」。
 * 2. 邏輯：識別內容中的「、」或「且」，將其轉換為單換行，使其在儲存格內呈現清單狀。
 * 3. 確保數據層面就是一個列表。
 */

async function makeConditionsIntoArrays() {
    console.log("正在將試算表中的過關/失敗條件轉換為陣列格式...");

    const auth = new google.auth.GoogleAuth({
        keyFile: CREDS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 1. 讀取目前的資料 (過關: H 欄, 失敗: I 欄)
    // 欄位規格: A:紀錄, B:任務代碼, C:陣營, D:章節代碼, E:任務名稱, F:任務敘述, G:開啟條件, H:過關條件, I:失敗條件...
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '任務資訊!A1:L200',
    });

    const rows = response.data.values;
    if (!rows) return;

    const updatedRows = rows.map((row, idx) => {
        if (idx === 0) return row;

        // 處理 H 欄 (過關條件)
        if (row[7]) {
            // 嘗試將常見分隔符號轉為換行 (建立陣列感)
            row[7] = row[7].replace(/、/g, '\n').replace(/且/g, '\n').split('\n').map(s => s.trim()).filter(s => s).join('\n');
        }

        // 處理 I 欄 (失敗條件)
        if (row[8]) {
            row[8] = row[8].replace(/、/g, '\n').replace(/且/g, '\n').split('\n').map(s => s.trim()).filter(s => s).join('\n');
        }

        return row;
    });

    // 2. 寫入試算表
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '任務資訊!A1',
        valueInputOption: 'RAW',
        resource: { values: updatedRows }
    });

    console.log("試算表條件陣列化完成。");
}

makeConditionsIntoArrays().catch(console.error);

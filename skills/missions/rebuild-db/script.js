const { google } = require('googleapis');
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function rebuildMissionDb() {
    console.log("正在重構任務資訊資料庫...");
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const sourceRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "'任務整理'!A1:G300" });
    const sourceRows = sourceRes.data.values || [];

    const HEADERS = ['紀錄完成', '任務代碼', '陣營', '章節代碼', '任務名稱', '任務敘述', '開啟條件', '過關條件', '失敗條件', '詳細頁面內容 (Markdown)', '地圖代碼', '參考資料 (Index)'];
    const finalRows = [HEADERS];

    let curF = "", curS = "", curC = "";
    sourceRows.slice(1).forEach(row => {
        if (row[0]) curF = row[0].trim().toLowerCase().includes('royal') ? 'royal' : (row[0].toLowerCase().includes('skydow') ? 'skydow' : 'third');
        if (row[1]) curS = row[1].trim().includes('第一部') ? 'seasons1' : 'seasons2';
        if (row[2]) curC = row[2].trim() === '入門教學' ? '光暈戰記入門教學' : row[2].trim();

        const mName = (row[3] || "").trim().replace(/（分支[一二]）/g, '');
        if (!mName) return;

        const mCode = `${curF}_${curS}_${curC}_${mName}`.toLowerCase().replace(/\s+/g, '_');
        const cCode = `${curF}_${curS}_${curC}`.toLowerCase().replace(/\s+/g, '_');

        finalRows.push([false, mCode, curF, cCode, mName, (row[4] || "").trim(), "", (row[5] || "").trim(), (row[6] || "").trim(), "", "", "1"]);
    });

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: '任務資訊!A1:Z1000' });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID, range: '任務資訊!A1', valueInputOption: 'USER_ENTERED', resource: { values: finalRows }
    });
}

rebuildMissionDb().catch(console.error);

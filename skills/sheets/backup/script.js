const { google } = require('googleapis');
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function backupSheet() {
    console.log("正在備份角色資訊分頁...");
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const backupTitle = "角色資訊_備份";
    let backupSheet = spreadsheet.data.sheets.find(s => s.properties.title === backupTitle);
    
    if (backupSheet) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ deleteSheet: { sheetId: backupSheet.properties.sheetId } }] }
        });
    }

    const sourceSheet = spreadsheet.data.sheets.find(s => s.properties.title === '角色資訊');
    const res = await sheets.spreadsheets.sheets.copyTo({
        spreadsheetId: SPREADSHEET_ID,
        sheetId: sourceSheet.properties.sheetId,
        resource: { destinationSpreadsheetId: SPREADSHEET_ID }
    });

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: [{ updateSheetProperties: { properties: { sheetId: res.data.sheetId, title: backupTitle }, fields: 'title' } }] }
    });

    console.log("備份完成。");
}

backupSheet().catch(console.error);

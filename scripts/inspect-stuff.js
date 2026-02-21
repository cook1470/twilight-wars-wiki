const { google } = require('googleapis');
const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function inspectStuffSheet() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'StuffInfo!A1:O10',
    });

    console.log("=== StuffInfo 分頁數據檢查 ===");
    console.table(response.data.values);
}

inspectStuffSheet().catch(console.error);

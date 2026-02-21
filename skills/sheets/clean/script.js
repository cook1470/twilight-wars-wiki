const { google } = require('googleapis');
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function cleanSheet() {
    console.log("正在清理試算表內容格式...");
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const targetSheets = ['任務資訊', '章節資訊'];

    for (const name of targetSheets) {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${name}!A1:O500` });
        const rows = response.data.values;
        if (!rows) continue;

        const cleanedRows = rows.map((row, idx) => {
            if (idx === 0) return row;
            return row.map(cell => {
                if (typeof cell !== 'string') return cell;
                return cell.split('\n').map(line => line.replace(/^[ 　]+/g, '').trim()).filter(line => line !== "").join('\n\n');
            });
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID, range: `${name}!A1`,
            valueInputOption: 'RAW', resource: { values: cleanedRows }
        });
    }
    console.log("清理完成。");
}

cleanSheet().catch(console.error);

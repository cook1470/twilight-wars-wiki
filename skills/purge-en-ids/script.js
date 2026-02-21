const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const WIKI_DIR = path.join(__dirname, '../../../docs/lore/characters/details');
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function runPurge() {
    console.log("正在執行英文 ID 汙染大清洗...");

    if (fs.existsSync(WIKI_DIR)) {
        const files = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith('.md'));
        files.forEach(file => {
            if (!/^[\u4e00-\u9fa5]/.test(file)) {
                const filePath = path.join(WIKI_DIR, file);
                console.log(`刪除英文檔名檔案: ${file}`);
                fs.unlinkSync(filePath);
            }
        });
    }

    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '角色資訊!A1:H500',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    const header = rows[0];
    const filteredRows = [header];

    rows.slice(1).forEach(row => {
        const id = row[0];
        if (id && /^[\u4e00-\u9fa5]/.test(id)) {
            filteredRows.push(row);
        }
    });

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:Z500' });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '角色資訊!A1',
        valueInputOption: 'RAW',
        resource: { values: filteredRows },
    });

    console.log("英文 ID 清洗完成。");
}

runPurge().catch(console.error);

const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function getCharacter(targetName) {
    if (!targetName) {
        console.log("用法: node skills/characters/get/script.js \"角色名稱\"");
        return;
    }

    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '角色資訊!A1:K500',
    });

    const rows = res.data.values;
    if (!rows) return;

    const headers = rows[0];
    const charRow = rows.find(row => row[3] === targetName);

    if (!charRow) {
        console.log(`找不到角色: ${targetName}`);
        return;
    }

    headers.forEach((header, index) => {
        console.log(`${header}: ${charRow[index] || ""}`);
    });
}

const target = process.argv[2];
getCharacter(target).catch(console.error);

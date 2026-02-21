const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function updateCharacter() {
    const targetName = process.argv[2];
    const columnHeader = process.argv[3];
    const newValue = process.argv[4];

    if (!targetName || !columnHeader || newValue === undefined) {
        console.log('用法: node skills/characters/update/script.js "角色名稱" "欄位標題" "新內容"');
        return;
    }

    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:K500'
    });

    const rows = res.data.values;
    if (!rows) return;

    const headers = rows[0];
    const columnIndex = headers.indexOf(columnHeader);
    if (columnIndex === -1) {
        console.log(`錯誤: 找不到欄位「${columnHeader}」`);
        return;
    }

    const rowIndex = rows.findIndex(row => row[3] === targetName);
    if (rowIndex === -1) {
        console.log(`錯誤: 找不到角色「${targetName}」`);
        return;
    }

    const columnLetter = String.fromCharCode(65 + columnIndex);
    const range = `角色資訊!${columnLetter}${rowIndex + 1}`;

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[newValue]] }
    });

    console.log(`成功更新「${targetName}」的「${columnHeader}」。`);
}

updateCharacter().catch(console.error);

const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

/**
 * 用法: node scripts/update-char.js "角色名稱" "欄位標題" "新內容"
 * 範例: node scripts/update-char.js "亞拜爾上校" "英文名稱" "Colonel Abayer"
 */
async function updateCharacter() {
    const targetName = process.argv[2];
    const columnHeader = process.argv[3];
    const newValue = process.argv[4];

    if (!targetName || !columnHeader || newValue === undefined) {
        console.log('用法: node scripts/update-char.js "角色名稱" "欄位標題" "新內容"');
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
    const columnIndex = headers.indexOf(columnHeader);
    if (columnIndex === -1) {
        console.log(`錯誤: 找不到欄位「${columnHeader}」。現有欄位: ${headers.join(', ')}`);
        return;
    }

    const rowIndex = rows.findIndex(row => row[3] === targetName);
    if (rowIndex === -1) {
        console.log(`錯誤: 找不到角色「${targetName}」`);
        return;
    }

    // Google Sheets API 的範圍是從 1 開始，且 rowIndex 0 是 header，所以實體 Row 是 rowIndex + 1
    const sheetRowNumber = rowIndex + 1;
    // 轉換欄位索引為 A, B, C...
    const columnLetter = String.fromCharCode(65 + columnIndex);
    const range = `角色資訊!${columnLetter}${sheetRowNumber}`;

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[newValue]] }
    });

    console.log(`成功更新「${targetName}」的「${columnHeader}」為: ${newValue}`);
}

updateCharacter().catch(console.error);

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

/**
 * 💋 THEA'S SURGICAL UPDATE ENGINE v2.0 (File Injection Edition)
 * 功能：更新試算表指定角色資料。
 * 特色：支援從外部檔案讀取 Markdown 內容進行注入。
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function updateCharacter() {
    const targetName = process.argv[2];
    const columnHeader = process.argv[3];
    let newValue = process.argv[4];

    if (!targetName || !columnHeader || newValue === undefined) {
        console.log('用法 (直接字串): node skills/characters/update/script.js "角色名稱" "欄位標題" "新內容"');
        console.log('用法 (注入檔案): node skills/characters/update/script.js "角色名稱" "欄位標題" "@path/to/file.md"');
        return;
    }

    // 💡 支援未來希雅：如果內容以 @ 開頭，則視為路徑並讀取檔案
    if (newValue.startsWith('@')) {
        const filePath = path.resolve(process.cwd(), newValue.substring(1));
        if (fs.existsSync(filePath)) {
            console.log(`正在從檔案讀取內容：${filePath}`);
            newValue = fs.readFileSync(filePath, 'utf8').trim();
        } else {
            console.error(`錯誤：找不到指定檔案 ${filePath}`);
            return;
        }
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

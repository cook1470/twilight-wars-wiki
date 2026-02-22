const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

/**
 * 💋 THEA'S SURGICAL UPDATE ENGINE v2.1 (Header-Aware Edition)
 * 功能：更新試算表指定角色資料。
 * 特色：
 * 1. 支援從外部檔案讀取 Markdown 內容 (@path)。
 * 2. 自動對齊 Header 標題，不再依賴固定索引。
 * 3. 支援 ID 或 中文名稱 雙重匹配。
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
        console.log('用法: node skills/characters/update/script.js "角色名稱" "欄位標題" "新內容"');
        return;
    }

    if (newValue.startsWith('@')) {
        const filePath = path.resolve(process.cwd(), newValue.substring(1));
        if (fs.existsSync(filePath)) {
            newValue = fs.readFileSync(filePath, 'utf8').trim();
        } else {
            console.error(`錯誤：找不到指定檔案 ${filePath}`);
            return;
        }
    }

    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:L500'
    });

    const rows = res.data.values;
    if (!rows) return;

    const headers = rows[0];
    const columnIndex = headers.indexOf(columnHeader);
    if (columnIndex === -1) {
        console.error(`錯誤: 找不到欄位「${columnHeader}」。可用欄位：${headers.join(', ')}`);
        return;
    }

    // 尋找 ID 欄位與 中文名稱 欄位的索引
    const idIndex = headers.indexOf('ID');
    const nameIndex = headers.indexOf('中文名稱');

    const rowIndex = rows.findIndex(row => 
        (idIndex !== -1 && row[idIndex] === targetName) || 
        (nameIndex !== -1 && row[nameIndex] === targetName)
    );

    if (rowIndex === -1) {
        console.error(`錯誤: 找不到角色「${targetName}」`);
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

    console.log(`✅ 成功更新「${targetName}」的「${columnHeader}」。`);
}

updateCharacter().catch(console.error);

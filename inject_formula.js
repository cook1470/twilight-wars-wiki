const { google } = require('googleapis');
const path = require('path');

/**
 * 💋 THEA'S FORMULA INJECTOR v1.0
 * 功能：在試算表「參考資料 (名稱)」欄位注入智慧公式，達成 Index 動態連動。
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, 'credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function injectFormulas() {
    const sheets = await getSheetsClient();
    
    // 1. 獲取 Header 位置
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:Z1'
    });
    const headers = res.data.values[0];
    const indexColIndex = headers.indexOf('參考資料 (Index)');
    const nameColIndex = headers.indexOf('參考資料 (名稱)');

    if (indexColIndex === -1 || nameColIndex === -1) {
        console.error('找不到欄位。');
        return;
    }

    const indexLetter = String.fromCharCode(65 + indexColIndex);
    const nameLetter = String.fromCharCode(65 + nameColIndex);

    /**
     * 公式邏輯說明：
     * 1. SPLIT(indexLetter2, ", ") -> 將 "1, 2" 拆成陣列 {1, 2}
     * 2. VLOOKUP(..., '參考資料庫'!A:C, 3, FALSE) -> 去庫裡查第 3 欄的名稱
     * 3. JOIN(CHAR(10), ...) -> 用換行符號合併結果
     * 4. IFERROR(..., "") -> 如果 Index 為空或找不到，顯示空白
     */
    const formula = `=IFERROR(JOIN(CHAR(10), ARRAYFORMULA(VLOOKUP(VALUE(SPLIT(${indexLetter}2, ", ")), '參考資料庫'!$A:$C, 3, FALSE))), "")`;

    console.log(`正在注入公式至 ${nameLetter} 欄位...`);

    // 這裡我們只注入第一列，然後利用 Google Sheets 的自動填充或手動拉下
    // 或者我們直接批量注入所有列 (例如 A2:A500)
    // 為了確保 Cook 之後新增資料也能用，我們可以使用 ARRAYFORMULA 的變體或者直接寫入
    
    // 為了精確，我們寫入一筆測試，並告訴 Cook 如何操作
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `角色資訊!${nameLetter}2`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[formula]] }
    });

    console.log(`✅ 已在 ${nameLetter}2 注入公式。`);
}

injectFormulas().catch(console.error);

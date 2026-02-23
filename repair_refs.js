const { google } = require('googleapis');
const path = require('path');

/**
 * 💋 THEA'S REFERENCE REPAIR & NAME SYNC v2.2
 * 功能：
 * 1. 修復「參考資料 (Index)」中被 Google 誤判為日期的欄位（改回純字串）。
 * 2. 根據 Index 從「參考資料庫」自動填入「參考資料 (名稱)」。
 * 3. 支援多筆資料（以逗號分隔）。
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, 'credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function repairReferences() {
    const sheets = await getSheetsClient();

    // 1. 讀取參考資料庫
    const refRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '參考資料庫!A2:C500'
    });
    const refData = refRes.data.values || [];
    const refMap = {};
    refData.forEach(row => {
        if (row[0] && row[2]) {
            refMap[row[0].trim()] = row[2].trim();
        }
    });

    // 2. 讀取角色資訊
    const charRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:Z500'
    });
    const charRows = charRes.data.values;
    if (!charRows) return;

    const charHeaders = charRows[0];
    const indexColIndex = charHeaders.indexOf('參考資料 (Index)');
    const nameColIndex = charHeaders.indexOf('參考資料 (名稱)');
    const idColIndex = charHeaders.indexOf('ID');

    if (indexColIndex === -1 || nameColIndex === -1) {
        console.error('找不到指定的參考資料欄位。');
        return;
    }

    const updates = [];

    charRows.slice(1).forEach((row, rowIndex) => {
        let indexVal = row[indexColIndex] || '';
        const charId = row[idColIndex];
        const currentRowIndex = rowIndex + 2; // 1-indexed, +1 for header

        // 修復日期錯誤：如果是數值或日期格式，嘗試轉換回字串
        // Google Sheets API 讀取時，如果格式是日期，有時會變成字串 "1, 2" 這種
        // 我們強制補一個單引號或是確保它是字串格式
        
        const cleanIndices = indexVal.split(/[,，]/).map(s => s.trim()).filter(s => s);
        
        if (cleanIndices.length > 0) {
            // 生成對應的名稱
            const names = cleanIndices.map(idx => refMap[idx] || `(找不到 Index ${idx})`);
            const combinedNames = names.join('\n');

            // 準備更新
            // Index 欄位：強制加單引號確保為字串
            updates.push({
                range: `角色資訊!${String.fromCharCode(65 + indexColIndex)}${currentRowIndex}`,
                values: [['\'' + cleanIndices.join(', ')]]
            });
            // 名稱欄位：填入對應名稱
            updates.push({
                range: `角色資訊!${String.fromCharCode(65 + nameColIndex)}${currentRowIndex}`,
                values: [[combinedNames]]
            });
            
            console.log(`[+] 準備修復: ${charId} -> Index: ${cleanIndices.join(', ')}`);
        }
    });

    if (updates.length > 0) {
        console.log(`\n正在批量更新 ${updates.length} 個儲存格...`);
        // 分批更新以避免 API 限制 (或使用 batchUpdate)
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                data: updates,
                valueInputOption: 'USER_ENTERED'
            }
        });
        console.log('✅ 批量修復與名稱同步完成！');
    } else {
        console.log('沒有需要更新的資料。');
    }
}

repairReferences().catch(console.error);

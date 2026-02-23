const { google } = require('googleapis');
const path = require('path');

/**
 * 💋 THEA'S SURGICAL INDEX REPAIR v2.3
 * 功能：針對「紀錄完成」狀態進行不同的 Index 修復策略。
 * 1. False: 統一修復為 '1, 2
 * 2. True: 精確修復誤判的日期 (如 2001 -> 1, 20 -> 20)
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, 'credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function surgicalRepair() {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:Z500'
    });
    const rows = res.data.values;
    if (!rows) return;

    const headers = rows[0];
    const indexCol = headers.indexOf('參考資料 (Index)');
    const doneCol = headers.indexOf('紀錄完成');
    const idCol = headers.indexOf('ID');

    const updates = [];

    rows.slice(1).forEach((row, rowIndex) => {
        const currentRowIndex = rowIndex + 2;
        const charId = row[idCol];
        const isDone = row[doneCol] === 'TRUE';
        let indexVal = row[indexCol] || '';

        // 偵測是否包含異常的日期格式 (2001, 20 等)
        if (indexVal.includes('2001') || indexVal.includes('20') || indexVal.includes('/') || indexVal.includes('-')) {
            let newValue = '';
            
            if (!isDone) {
                // 策略 A: 未完成 -> 統一 1, 2
                newValue = "'1, 2";
                console.log(`[-] 未完成修復: ${charId} -> ${newValue}`);
            } else {
                // 策略 B: 已完成 -> 手動映射邏輯
                // 2001, 2, 3 通常是 1, 2, 3 的誤判
                // 20, 1, 2 通常是 1, 2 的誤判 (影俠案例)
                let parts = indexVal.split(/[,，]/).map(s => s.trim());
                let fixedParts = parts.map(p => {
                    if (p === '2001') return '1';
                    if (p === '20') return ''; // 影俠的 20 似乎是多出來的
                    return p;
                }).filter(p => p);
                
                newValue = "'" + fixedParts.join(', ');
                console.log(`[!] 已完成修復: ${charId} (${indexVal}) -> ${newValue}`);
            }

            updates.push({
                range: `角色資訊!${String.fromCharCode(65 + indexCol)}${currentRowIndex}`,
                values: [[newValue]]
            });
        }
    });

    if (updates.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { data: updates, valueInputOption: 'USER_ENTERED' }
        });
        console.log(`\n✅ 成功手術式修復 ${updates.length} 個異常 Index。`);
    } else {
        console.log('未偵測到剩餘的日期異常。');
    }
}

surgicalRepair().catch(console.error);

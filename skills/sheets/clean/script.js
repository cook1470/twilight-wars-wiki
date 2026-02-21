const { google } = require('googleapis');
const path = require('path');

/**
 * THEA'S DATABASE CLEANER v2.0
 * 1. 移除所有行首空格與多餘換行。
 * 2. 徹底清空所有的 "(待補充)" 佔位符。
 * 3. 涵蓋 角色、任務、章節 所有核心分頁。
 */

const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

async function cleanAllSheets() {
    console.log("正在執行試算表「(待補充)」與格式大掃除...");
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const targetSheets = ['角色資訊', '任務資訊', '章節資訊'];

    for (const name of targetSheets) {
        console.log(`清理分頁: ${name}`);
        const response = await sheets.spreadsheets.values.get({ 
            spreadsheetId: SPREADSHEET_ID, 
            range: `${name}!A1:O1000` 
        });
        const rows = response.data.values;
        if (!rows) continue;

        const cleanedRows = rows.map((row, idx) => {
            if (idx === 0) return row; // 跳過標題
            return row.map(cell => {
                if (typeof cell !== 'string') return cell;
                
                // 1. 移除 "(待補充)"
                let cleaned = cell.replace(/\(待補充\)/g, '').trim();
                
                // 2. 格式清理 (移除行首空格，雙換行分段)
                if (cleaned) {
                    cleaned = cleaned.split('\n')
                        .map(line => line.replace(/^[ 　]+/g, '').trim())
                        .filter(line => line !== "")
                        .join('\n\n');
                }
                
                return cleaned;
            });
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID, 
            range: `${name}!A1`,
            valueInputOption: 'RAW', 
            resource: { values: cleanedRows }
        });
    }
    console.log("✅ 試算表所有「(待補充)」佔位符已清空，格式已純淨化。");
}

cleanAllSheets().catch(console.error);

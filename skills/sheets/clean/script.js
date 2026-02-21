const { google } = require('googleapis');
const path = require('path');

/**
 * THEA'S DATABASE CLEANER v2.1 (Checkbox Safe)
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
            if (idx === 0) return row;
            return row.map((cell, colIdx) => {
                // 💡 針對第一欄 (紀錄完成) 進行特殊布林轉換，避免變成字串
                if (colIdx === 0) {
                    const val = String(cell).trim().toUpperCase();
                    return (val === 'TRUE');
                }

                if (typeof cell !== 'string') return cell;
                let cleaned = cell.replace(/\(待補充\)/g, '').trim();
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
            valueInputOption: 'USER_ENTERED', // 💡 改用 USER_ENTERED 確保布林值生效
            resource: { values: cleanedRows }
        });
    }
    console.log("✅ 試算表清理完成，複選框已受保護。");
}

cleanAllSheets().catch(console.error);

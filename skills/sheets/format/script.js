const { google } = require('googleapis');
const path = require('path');

const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';

function estimateWidth(rows, colIndex) {
    let maxLen = 0;
    rows.forEach(row => {
        const cell = row[colIndex] || "";
        const lines = cell.split('\n');
        lines.forEach(line => {
            let len = 0;
            for (let i = 0; i < line.length; i++) {
                len += (line.charCodeAt(i) > 255) ? 12 : 7;
            }
            if (len > maxLen) maxLen = len;
        });
    });
    return Math.min(Math.max(maxLen + 20, 40), 400); 
}

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

async function formatAllSheets() {
    console.log("正在格式化所有分頁...");
    const sheets = await getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    
    const targetSheets = ['任務資訊', '章節資訊', '角色資訊'];

    for (const name of targetSheets) {
        const sheet = spreadsheet.data.sheets.find(s => s.properties.title === name);
        if (!sheet) continue;
        const sheetId = sheet.properties.sheetId;

        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${name}!A1:O500` });
        const rows = response.data.values || [];
        const rowCount = rows.length;

        const requests = [];

        for (let i = 0; i < (rows[0]?.length || 0); i++) {
            requests.push({
                updateDimensionProperties: {
                    range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
                    properties: { pixelSize: estimateWidth(rows, i) },
                    fields: 'pixelSize'
                }
            });
        }

        requests.push({ unmergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 500, startColumnIndex: 0, endColumnIndex: 20 } } });
        requests.push({
            setDataValidation: {
                range: { sheetId, startRowIndex: 1, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: 1 },
                rule: { condition: { type: "BOOLEAN" }, showCustomUi: true }
            }
        });

        requests.push({
            repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: 5 },
                cell: { userEnteredFormat: { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" } },
                fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)"
            }
        });

        await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests } });
    }
}

formatAllSheets().catch(console.error);

const { google } = require('googleapis');
const path = require('path');

/**
 * 💋 THEA'S DATABASE ARCHITECT v31.0
 * 功能：在「角色資訊」分頁中插入「分類」欄位，並自動遷移代碼中的 isGeneric 邏輯到試算表中。
 * 欄位順序調整為：紀錄完成, ID, 陣營, 分類, 中文名稱, 英文名稱, 角色種類, 簡述...
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, '../credentials/google-sheets.json');

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

// 搬運原有的 isGeneric 邏輯
function getInitialCategory(name) {
    const core = ['哈斯卡大帝', '阿薩斯', '雅堤米絲', '阿波羅', '魏斯蒙少尉', '亞拜爾上校', '影娘', '伊拉馬長老', '教主', '青嵩散人', '隱居士', '蕭居士', '腦洞主', '不動佛', '克萊德騎士'];
    if (core.some(c => name.includes(c))) return "核心英雄";
    const genericKeywords = ['人', '兵', '小隊長', '隊長', '衛', '狙擊', '傭兵', '教徒', '殭屍', '跳屍', '猩猩', '鹿', '兔', '精靈', '靈體', '精魂', '氣魄'];
    return genericKeywords.some(kw => name.includes(kw)) ? "雜兵生物" : "核心英雄";
}

async function updateCharSchema() {
    console.log("正在升級角色資訊架構：新增「分類」欄位並遷移邏輯...");
    const sheets = await getSheetsClient();

    // 1. 讀取現有數據 (A-K 欄)
    // 0紀錄完成, 1ID, 2陣營, 3中文名稱, 4英文名稱, 5角色種類, 6簡述, 7背景, 8任務, 9參考Index, 10參考名稱
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:K500' });
    const rows = res.data.values;
    if (!rows) return;

    const newHeaders = [
        '紀錄完成', 'ID', '陣營', '分類', '中文名稱', '英文名稱', '角色種類', '簡述', '背景資訊 (Markdown)', '登場任務 (ID串)', '參考資料 (Index)', '參考資料 (名稱)'
    ];

    const updatedRows = rows.map((row, idx) => {
        if (idx === 0) return newHeaders;
        const newRow = [...row];
        const nameZh = row[3];
        const category = getInitialCategory(nameZh || "");
        
        // 在「陣營」與「中文名稱」之間插入「分類」 (Index 3)
        newRow.splice(3, 0, category);
        return newRow;
    });

    // 2. 徹底重置分頁內容
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A1:Z1000' });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '角色資訊!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: updatedRows }
    });

    // 3. 修復 UI 與 Checkbox
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === '角色資訊').properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: [
            { unmergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 20 } } },
            { setDataValidation: { range: { sheetId, startRowIndex: 1, endRowIndex: updatedRows.length, startColumnIndex: 0, endColumnIndex: 1 }, rule: { condition: { type: "BOOLEAN" }, showCustomUi: true } } },
            { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 6 }, cell: { userEnteredFormat: { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" } }, fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)" } }
        ]}
    });

    console.log("✅ 角色資訊架構升級完成。");
}

updateCharSchema().catch(console.error);

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * 💋 THEA'S UNIFIED SYNC ENGINE v22.0 (分類動態化 + 中立勢力優化)
 * 1. 同步邏輯依照試算表「分類」欄位進行動態分組，不再硬編碼分類名稱。
 * 2. 跨檔案連結採用 Wiki 根目錄絕對路徑。
 */

const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const CHAR_INDEX_DIR = path.join(__dirname, '../../../docs/lore/characters');
const CHAR_DETAIL_DIR = path.join(CHAR_INDEX_DIR, 'details');
const MISSION_DIR = path.join(__dirname, '../../../docs/missions');
const MISSION_DETAIL_DIR = path.join(MISSION_DIR, 'details');
const MAPS_DATA_PATH = path.join(__dirname, '../../../docs/world/maps_data.json');
const OFFICIAL_URL = "https://twilightwars.gamelet.online/";

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

const formatText = (text) => text ? text.trim().split('\n').map(line => line.trim()).filter(l => l).join('\n\n') : "";

const linkifyMissionsForChar = (missionsStr, missionPathMap) => {
    if (!missionsStr || missionsStr.trim() === "" || missionsStr.includes("(尚未有經查證")) return "(尚未有經查證的登場紀錄)";
    return missionsStr.split(/[、,，\n]/).map(m => {
        const name = m.trim();
        const absPath = missionPathMap ? missionPathMap.get(name) : null;
        return name ? (absPath ? `[${name}](<${absPath}>)` : `[${name}](</missions/details/${name}.md>)`) : null;
    }).filter(n => n).join('、');
};

async function syncAll() {
    console.log("🚀 啟動全系統同步 (v22.0 - 分類動態化)...");
    const sheets = await getSheetsClient();

    const mapsData = JSON.parse(fs.readFileSync(MAPS_DATA_PATH, 'utf8'));
    const mapTable = Object.fromEntries(mapsData.map(m => [m.id, m.name]));
    
    // 欄位順序 (v31): 0紀錄完成, 1ID, 2陣營, 3分類, 4中文名稱, 5英文名稱, 6角色種類, 7簡述, 8背景, 9任務, 10參考Index
    const charRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A2:L500' });
    const missionRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '任務資訊!A2:O300' });
    const chapterRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '章節資訊!A2:G100' });
    const refRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '參考資料庫!A2:D10' });

    const charRows = charRes.data.values || [];
    const missionRows = missionRes.data.values || [];
    const chapterRows = chapterRes.data.values || [];
    const refTable = Object.fromEntries((refRes.data.values || []).map(r => [r[0], { text: r[2], url: r[3] }]));

    const missionToChars = new Map();
    const factionToChars = {}; 
    const missionPathMap = new Map(); 

    const factionDirMap = { 'royal': 'royal', 'skydow': 'skydow', 'third': 'third' };
    const seasonDirMap = { '第一部 - 曙光乍現': 'seasons1', '第二部 - 屠魔英雄': 'seasons2' };

    // --- 0. 預先掃描章節與任務建立路徑映射 ---
    const chapterMeta = new Map();
    chapterRows.forEach(row => {
        const [isDone, cCode, factionId, seasonStr, chapterName] = row;
        const fDir = factionDirMap[factionId];
        const sDir = seasonDirMap[seasonStr];
        if (fDir && sDir && chapterName) chapterMeta.set(cCode, { fDir, sDir, chapterName });
    });

    missionRows.forEach(row => {
        const [isDone, mId, factionId, chapterCode, mName] = row;
        const meta = chapterMeta.get(chapterCode);
        if (meta && mName) {
            const absPath = `/missions/${meta.fDir}/${meta.sDir}/${meta.chapterName}/${mName}.md`;
            missionPathMap.set(mName, absPath);
        }
    });

    // --- 1. 同步角色詳情與建立索引映射 ---
    charRows.forEach(row => {
        const [isDone, id, faction, category, nameZh, nameEn, species, brief, background, missionsStr, refIndices] = row;
        if (!nameZh) return;

        const missions = (missionsStr || "").split(/[、,，\n]/).map(m => m.trim()).filter(m => m);
        missions.forEach(mName => {
            if (!missionToChars.has(mName)) missionToChars.set(mName, []);
            missionToChars.get(mName).push(nameZh);
        });

        // 動態分類邏輯：直接以試算表中的「分類」文字為 Key
        const catKey = category || "其他";
        if (!factionToChars[faction]) factionToChars[faction] = {};
        if (!factionToChars[faction][catKey]) factionToChars[faction][catKey] = [];
        
        factionToChars[faction][catKey].push({ id: nameZh, name: nameZh, brief: brief || "(待補充)" });

        const displayTitle = nameEn ? `${nameZh} (${nameEn})` : nameZh;
        let refBlock = refIndices ? String(refIndices).split(',').map(idx => {
            const ref = refTable[idx.trim()];
            return ref ? `- [${ref.text}](${ref.url})` : null;
        }).filter(n => n).join('\n') : "(待補充)";

        const content = `---\nid: ${id || nameZh}\nname_zh: ${nameZh}\nname_en: ${nameEn || ""}\nfaction: ${faction || ""}\nspecies: ${species || ""}\nbrief: ${brief || ""}\n---\n\n# ${displayTitle}\n\n${brief || "(待補充)"}\n\n## 背景資訊\n\n${formatText(background) || "(待補充)"}\n\n## 登場任務\n${linkifyMissionsForChar(missionsStr, missionPathMap)}\n\n## 參考資料\n${refBlock}\n`;
        fs.writeFileSync(path.join(CHAR_DETAIL_DIR, `${nameZh}.md`), content);
    });

    // --- 2. 重建角色索引頁 (動態分類標題) ---
    console.log("正在重建角色索引頁 (動態分類)...");
    const factionFiles = { 
        '天影十字軍': 'skydow-warriors.md', 
        '皇家騎士團': 'royal-knights.md', 
        '第三勢力': 'third-force.md', 
        '中立勢力': 'neutral.md', 
        '其他': 'others.md' 
    };

    Object.entries(factionFiles).forEach(([fac, fileName]) => {
        const catGroups = factionToChars[fac] || {};
        let fileContent = `# ${fac} 人物誌\n\n`;
        
        // 遍歷該陣營下的所有動態分類
        const categories = Object.keys(catGroups);
        if (categories.length === 0) {
            fileContent += `(暫無資料)\n`;
        } else {
            // 優先顯示「核心英雄」，其他的隨機排
            const sortedCats = categories.sort((a, b) => a === '核心英雄' ? -1 : 1);
            sortedCats.forEach(cat => {
                fileContent += `## ${cat}\n\n`;
                catGroups[cat].forEach(c => {
                    const weightClass = cat === '核心英雄' ? '**' : '';
                    fileContent += `- [${weightClass}${c.name}${weightClass}](</lore/characters/details/${c.id}.md>) - ${c.brief}\n`;
                });
                fileContent += `\n`;
            });
        }
        
        fs.writeFileSync(path.join(CHAR_INDEX_DIR, fileName), fileContent);
    });

    // --- 3. 同步任務系統 (結構層級化) ---
    console.log("正在同步任務系統 (層級化)...");
    const missionsInChapter = new Map();
    missionRows.forEach(row => {
        const chapterCode = row[3];
        if (!chapterCode) return;
        if (!missionsInChapter.has(chapterCode)) missionsInChapter.set(chapterCode, []);
        const mapIds = (row[10] || "").split(',').map(id => id.trim()).filter(id => id);
        const missionMaps = mapIds.map(id => mapTable[id] || id).join('、');
        missionsInChapter.get(chapterCode).push({ name: row[4], description: row[5], open: row[6], win: row[7], fail: row[8], detail: row[9], refIdx: row[11], missionMaps });
    });

    for (const row of chapterRows) {
        const [isDone, cCode, factionId, seasonStr, chapterName, intro, openCond] = row;
        const factionDir = factionDirMap[factionId];
        const seasonDir = seasonDirMap[seasonStr];
        if (!factionDir || !seasonDir || !chapterName) continue;
        
        const chapterDir = path.join(MISSION_DIR, factionDir, seasonDir);
        const missionSubDir = path.join(chapterDir, chapterName);
        if (!fs.existsSync(missionSubDir)) fs.mkdirSync(missionSubDir, { recursive: true });

        const chapterFile = path.join(chapterDir, `${chapterName}.md`);
        const missions = missionsInChapter.get(cCode) || [];
        
        let chapterContent = `## ${chapterName}\n\n${formatText(intro) || "(待補充)"}\n\n`;
        if (openCond) chapterContent += `::: info 開啟條件\n${openCond.trim()}\n:::\n\n`;
        chapterContent += `---\n\n`;
        
        missions.forEach(m => {
            chapterContent += `### [${m.name}](</missions/${factionDir}/${seasonDir}/${chapterName}/${m.name}.md>)\n${formatText(m.description)}\n\n`;
            if (m.win) chapterContent += `- **過關條件**：${m.win}\n`;
            if (m.fail) chapterContent += `- **失敗條件**：${m.fail}\n`;
            chapterContent += `\n`;
        });
        fs.writeFileSync(chapterFile, chapterContent);

        missions.forEach(m => {
            const detailFile = path.join(missionSubDir, `${m.name}.md`);
            const backPath = `/missions/${factionDir}/${seasonDir}/${chapterName}.md`;
            const chars = missionToChars.get(m.name) || [];
            const charLinks = chars.map(c => `[${c}](</lore/characters/details/${c}.md>)`).join('、');
            let refBlock = "";
            if (m.refIdx) refBlock = String(m.refIdx).split(',').map(idx => { const ref = refTable[idx.trim()]; return ref ? `- [${ref.text}](${ref.url})` : null; }).filter(n => n).join('\n');
            let conditionsMd = "";
            if (m.win) conditionsMd += `- **過關條件**：${m.win}\n`;
            if (m.fail) conditionsMd += `- **失敗條件**：${m.fail}\n`;
            conditionsMd += `- **任務地圖**：${m.missionMaps || "待補充"}\n`;
            let openBlock = m.open ? `\n::: info 開啟條件\n${m.open.trim()}\n:::\n` : "";
            let detailContent = `---\nmission_name: ${m.name}\nfaction: ${factionId}\n---\n\n# ${m.name}\n\n[回到章節：${chapterName}](<${backPath}>)\n\n${formatText(m.description) || "(待補充)"}\n\n${conditionsMd}${openBlock}\n## 詳細資訊\n\n${formatText(m.detail) || "(待補充)"}\n\n## 登場角色\n${charLinks || "無"}\n\n## 參考資料\n- [《光暈戰記》官方遊戲](${OFFICIAL_URL})\n${refBlock}\n`;
            fs.writeFileSync(detailFile, detailContent);
        });
    }

    console.log("✅ 全系統同步完成 (動態分類與絕對路徑)。");
}

syncAll().catch(console.error);

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * 💋 THEA'S UNIFIED SYNC ENGINE v17.0 (Skills Edition)
 */

const MISSION_BASE_DIR = path.join(__dirname, '../../../docs/missions');
const DETAIL_DIR = path.join(MISSION_BASE_DIR, 'details');
const CREDS_PATH = path.join(__dirname, '../../../credentials/google-sheets.json');
const SPREADSHEET_ID = '1kRPdI6caisjZuHJGmCjB3kHBveR2RVAeTJoyCmqOZVs';
const MAPS_DATA_PATH = path.join(__dirname, '../../../docs/world/maps_data.json');
const OFFICIAL_URL = "https://twilightwars.gamelet.online/";

const formatText = (text) => {
    if (!text) return "";
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line !== "")
        .join('\n\n'); 
};

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({ keyFile: CREDS_PATH, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

function isGeneric(name) {
    const core = ['哈斯卡大帝', '阿薩斯', '雅堤米絲', '阿波羅', '魏斯蒙少尉', '亞拜爾上校', '影娘', '伊拉馬長老', '教主', '青嵩散人', '隱居士', '蕭居士', '腦洞主', '不動佛', '克萊德騎士'];
    if (core.some(c => name.includes(c))) return false;
    const genericKeywords = ['人', '兵', '小隊長', '隊長', '衛', '狙擊', '傭兵', '教徒', '殭屍', '跳屍', '猩猩', '鹿', '兔', '精靈', '靈體', '精魂', '氣魄'];
    return genericKeywords.some(kw => name.includes(kw));
}

async function syncCharacters(sheets) {
    console.log("正在同步角色系統...");
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '角色資訊!A2:K500' });
    const rows = res.data.values || [];
    const refRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '參考資料庫!A2:D10' });
    const refTable = Object.fromEntries((refRes.data.values || []).map(r => [r[0], { text: r[2], url: r[3] }]));

    const characters = [];
    rows.forEach(row => {
        const [isDone, id, faction, nameZh, nameEn, species, brief, background, missionsStr, refIndices] = row;
        if (!nameZh) return;
        const displayTitle = nameEn ? `${nameZh} (${nameEn})` : nameZh;
        let refBlock = refIndices ? String(refIndices).split(',').map(idx => {
            const ref = refTable[idx.trim()];
            return ref ? `- [${ref.text}](${ref.url})` : null;
        }).filter(n => n).join('\n') : "(待補充)";

        const content = `---\nid: ${id || nameZh}\nname_zh: ${nameZh}\nname_en: ${nameEn || ""}\nfaction: ${faction || ""}\nspecies: ${species || ""}\nbrief: ${brief || ""}\n---\n\n# ${displayTitle}\n\n${brief || "(待補充)"}\n\n## 背景資訊\n\n${background || "(待補充)"}\n\n## 登場任務\n${missionsStr || "(尚未有經查證的登場紀錄)"}\n\n## 參考資料\n${refBlock}\n`;
        fs.writeFileSync(path.join(__dirname, '../../../docs/lore/characters/details', `${nameZh}.md`), content);
        characters.push({ id: nameZh, name: nameZh, faction, brief });
    });

    console.log("正在重建角色索引頁...");
    const factionFiles = { '天影十字軍': 'skydow-warriors.md', '皇家騎士團': 'royal-knights.md', '第三勢力': 'third-force.md', '中立勢力': 'neutral.md', '其他': 'others.md' };
    Object.entries(factionFiles).forEach(([fac, fileName]) => {
        const list = characters.filter(c => c.faction === fac);
        let fileContent = `# ${fac} 人物誌\n\n`;
        const named = list.filter(c => !isGeneric(c.name));
        const generic = list.filter(c => isGeneric(c.name));
        fileContent += `## 具名角色 / 核心英雄\n\n`;
        if (named.length) named.forEach(c => fileContent += `- [**${c.name}**](<./details/${c.id}.md>) - ${c.brief}\n`);
        else fileContent += `(暫無資料)\n`;
        fileContent += `\n## 職位 / 雜兵 / 生物\n\n`;
        if (generic.length) generic.forEach(c => fileContent += `- [${c.name}](<./details/${c.id}.md>) - ${c.brief}\n`);
        else fileContent += `(暫無資料)\n`;
        fs.writeFileSync(path.join(__dirname, '../../../docs/lore/characters', fileName), fileContent);
    });
}

async function syncMissions(sheets) {
    console.log("正在同步任務系統...");
    const mapsData = JSON.parse(fs.readFileSync(MAPS_DATA_PATH, 'utf8'));
    const mapTable = Object.fromEntries(mapsData.map(m => [m.id, m.name]));
    const refRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '參考資料庫!A2:D10' });
    const refTable = Object.fromEntries((refRes.data.values || []).map(r => [r[0], { text: r[2], url: r[3] }]));

    const chapterRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '章節資訊!A2:G100' });
    const missionRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: '任務資訊!A2:L300' });
    const chapterRows = chapterRes.data.values || [];
    const missionRows = missionRes.data.values || [];

    const missionsInChapter = new Map();
    missionRows.forEach(row => {
        const chapterCode = row[3];
        if (!chapterCode) return;
        if (!missionsInChapter.has(chapterCode)) missionsInChapter.set(chapterCode, []);
        const mapIds = (row[10] || "").split(',').map(id => id.trim()).filter(id => id);
        const missionMaps = mapIds.map(id => mapTable[id] || id).join('、');
        missionsInChapter.get(chapterCode).push({ name: row[4], description: row[5], open: row[6], win: row[7], fail: row[8], detail: row[9], refIdx: row[11], missionMaps });
    });

    const factionDirMap = { 'royal': 'royal', 'skydow': 'skydow', 'third': 'third' };
    const seasonDirMap = { '第一部 - 曙光乍現': 'seasons1', '第二部 - 屠魔英雄': 'seasons2' };

    for (const row of chapterRows) {
        const [isDone, cCode, factionId, seasonStr, chapterName, intro, openCond] = row;
        const factionDir = factionDirMap[factionId];
        const seasonDir = seasonDirMap[seasonStr];
        if (!factionDir || !seasonDir || !chapterName) continue;

        const chapterFile = path.join(MISSION_BASE_DIR, factionDir, seasonDir, `${chapterName}.md`);
        const missions = missionsInChapter.get(cCode) || [];
        let chapterContent = `## ${chapterName}\n\n${formatText(intro) || "(待補充)"}\n\n`;
        if (openCond) chapterContent += `::: info 開啟條件\n${openCond.trim()}\n:::\n\n`;
        chapterContent += `---\n\n`;
        missions.forEach(m => {
            chapterContent += `### [${m.name}](<../../details/${m.name}.md>)\n${formatText(m.description)}\n\n`;
            if (m.win) chapterContent += `- **過關條件**：${m.win}\n`;
            if (m.fail) chapterContent += `- **失敗條件**：${m.fail}\n`;
            chapterContent += `\n`;
        });
        fs.writeFileSync(chapterFile, chapterContent);

        missions.forEach(m => {
            const detailFile = path.join(DETAIL_DIR, `${m.name}.md`);
            const backPath = `../${factionDir}/${seasonDir}/${chapterName}.md`;
            let refBlock = "(待補充)";
            if (m.refIdx) {
                refBlock = String(m.refIdx).split(',').map(idx => {
                    const ref = refTable[idx.trim()];
                    return ref ? `- [${ref.text}](${ref.url})` : null;
                }).filter(n => n).join('\n');
            }
            let detailContent = `---\nmission_name: ${m.name}\nfaction: ${factionId}\n---\n\n# ${m.name}\n\n[回到章節：${chapterName}](<${backPath}>)\n\n${formatText(m.description) || "(待補充)"}\n\n`;
            if (m.win) detailContent += `- **過關條件**：${m.win}\n`;
            if (m.fail) detailContent += `- **失敗條件**：${m.fail}\n`;
            detailContent += `- **任務地圖**：${m.missionMaps || "待補充"}\n`;
            if (m.open) detailContent += `\n::: info 開啟條件\n${m.open}\n:::\n`;
            detailContent += `\n## 詳細資訊\n\n${formatText(m.detail) || "(待補充)"}\n\n## 參考資料\n- [《光暈戰記》官方遊戲](${OFFICIAL_URL})\n${refBlock}\n`;
            fs.writeFileSync(detailFile, detailContent);
        });
    }
}

async function main() {
    const cmd = process.argv[2];
    const sheets = await getSheetsClient();

    if (cmd === 'sync') {
        await syncCharacters(sheets);
        await syncMissions(sheets);
        console.log("✅ 全系統同步完成。");
    } else {
        console.log("使用方式: node skills/wiki/sync/script.js sync");
    }
}

main().catch(console.error);

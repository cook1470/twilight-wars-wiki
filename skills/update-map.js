const fs = require('fs');
const path = require('path');

/**
 * 💋 THEA'S SKILL MAP GENERATOR v2.0
 * 負責掃描 skills/ 目錄下的所有 README.md，並生成 MAP.md 目錄。
 */

const SKILLS_DIR = __dirname;
const MAP_FILE = path.join(SKILLS_DIR, 'MAP.md');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

function generateMap() {
    console.log("正在生成技能地圖...");
    
    let content = "# 🗺️ 希雅的技能地圖 (Skills Map)\n\n";
    content += `更新時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\n\n`;
    content += "| 技能路徑 | 簡介 |\n";
    content += "| :--- | :--- |\n";

    const readmes = [];
    walk(SKILLS_DIR, (filePath) => {
        if (path.basename(filePath) === 'README.md') {
            readmes.push(filePath);
        }
    });

    readmes.sort().forEach(readmePath => {
        const readme = fs.readFileSync(readmePath, 'utf8');
        const lines = readme.split('\n');
        const title = lines[0].replace('# ', '').trim();
        const desc = lines.find(l => l.trim() && !l.startsWith('#') && !l.startsWith('!')) || "(無描述)";
        const relDir = path.dirname(path.relative(SKILLS_DIR, readmePath));
        
        content += `| [${title}](./${relDir}/README.md) | ${desc.trim()} |\n`;
    });

    fs.writeFileSync(MAP_FILE, content);
    console.log("✅ MAP.md 已更新。");
}

generateMap();

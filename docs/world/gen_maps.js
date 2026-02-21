const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'maps_data.json');
const outputDir = path.join(__dirname, 'maps');
const indexFile = path.join(__dirname, 'index.md');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const maps = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 生成個別地圖檔案
maps.forEach(map => {
    const content = `# ${map.name}\n\n- **系統識別代碼**：\`${map.id}\`\n\n## 地圖簡介\n${map.description}\n`;
    fs.writeFileSync(path.join(outputDir, `${map.id}.md`), content);
    console.log(`Generated: ${map.id}.md`);
});

// 生成索引頁面
let indexContent = `# 地圖介紹\n\n光暈世界中存在著許多各具特色的地理區域，每一塊土地都承載著不同的歷史與戰火。\n\n## 🌍 地圖列表\n\n| 地圖名稱 | 簡介 |\n| :--- | :--- |\n`;

maps.forEach(map => {
    const shortDesc = map.description.length > 30 ? map.description.substring(0, 30) + '...' : map.description;
    indexContent += `| [${map.name}](./maps/${map.id}.md) | ${shortDesc} |\n`;
});

fs.writeFileSync(indexFile, indexContent);
console.log('Generated index.md');

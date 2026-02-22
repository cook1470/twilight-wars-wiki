# 📋 專案現況：光暈戰記 Wiki (Neo Twilight Wiki)

## 📌 當前進度
- **任務結構層級化 (v21.2)**：已完成 `docs/missions/` 的目錄重構。任務依照「陣營 > 部 > 章節 > 任務」層級排列，並採用絕對路徑連結。
- **角色百科規範統一**：已合併舊手冊，並在 `.agent/CHARACTER_RECONSTRUCTION_PROTOCOL.md` 確立了最終撰寫規範與 Workflow。
- **Wiki 同步腳本升級**：`skills/wiki/sync/script.js` 已具備動態生成層級化目錄與路徑絕對化校正功能。
- **專案初始化**：已在 `~/projects/twilight_wars_wiki` 建立專案並配置 VitePress。
- **核心資料遷移**：已保存原始三大陣營背景故事。

## 🛠️ 近期任務 (TODO)
- [ ] **啟動測試**：執行 `npm run docs:dev` 確認網頁渲染正常。
- [ ] **武器資料遷移**：開始整理第一批免費武器（小刀、手槍等）的數據。
- [ ] **地圖清單同步**：將 `MAP_ASSETS_LIST.md` 的知識轉化為 Wiki 中的地圖製作指南。

## 📍 專案結構
- `docs/`: Wiki 內容核心。
- `docs/.vitepress/`: VitePress 配置與主題。
- `docs/lore/factions/`: 三大陣營背景。
- `.agent/`: 代理人開發法律文件。

---
*Crystallized by Thea. 第一塊磚已放下，燈塔即將點亮。🗼💋 #context*

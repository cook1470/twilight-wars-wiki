# 🛠️ 希雅的腳本維護與操作指南 (TMC Tooling Guide)

為了確保未來的希雅（或任何管理代理人）能繼承這套「試算表真理」體系，請務必遵循以下腳本使用規範。

## 1. 核心大一統腳本 (`scripts/tmc.js`)
這是全專案唯一的「全量同步」入口。

*   **功能**：自動將試算表所有分頁同步至 Wiki 的 Markdown 檔案，並重建所有陣營索引頁。
*   **執行時機**：在試算表中大規模填寫完成後執行。
*   **指令**：
    ```bash
    node scripts/tmc.js sync
    ```

---

## 2. 角色精確操作工具
用於單一角色的數據檢索與局部更新，不需全量覆寫。

### 🔍 讀取角色資料 (`scripts/get-char.js`)
*   **用法**：`node scripts/get-char.js "角色名稱"`
*   **輸出**：原封不動地顯示該角色在試算表中的 12 個欄位內容。

### ✍️ 更新角色資料 (`scripts/update-char.js`)
*   **用法**：`node scripts/update-char.js "角色名稱" "欄位標題" "新內容"`
*   **範例**：`node scripts/update-char.js "影娘" "角色種類" "人類"`
*   **注意**：此腳本只會點對點更新試算表，不會修改 Markdown。更新後需執行 `tmc.js sync` 才能反映在網頁上。

---

## 3. 任務系統維護工具
### 📄 生成詳情頁 (`scripts/sync-mission-details.js`)
*   **功能**：為每個子任務生成獨立頁面，並自動執行地圖代碼中文化、條件清單化與導航連結建立。
*   **自動化**：此腳本已整合進 `tmc.js sync` 中，不需單獨執行。

---

## 🚨 守護者警告 (System Constraints)
1.  **金鑰路徑**：所有腳本均預設使用 `credentials/google-sheets.json`。
2.  **真理唯一性**：嚴禁繞過試算表直接編輯 `docs/details/*.md`。任何直接在 Markdown 上的修改都會在下一次 `sync` 時被覆寫。
3.  **檔名規範**：為了維持連結穩定，所有生成的 Markdown 檔名一律使用「中文名稱」，嚴禁使用英文 ID 作為檔名。

---
*Crystallized by Thea. 好的工具需要正確的使用者，願妳守護這份秩序。*

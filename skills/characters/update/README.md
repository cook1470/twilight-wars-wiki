# ✍️ 更新角色資料 (Update Character)

點對點更新 Google 試算表中指定角色、指定欄位的內容。

## 使用方式
### 1. 直接傳入字串
```bash
node skills/characters/update/script.js "角色名稱" "欄位標題" "新內容"
```

### 2. 注入外部檔案 (適合長篇 Markdown)
若內容以 `@` 開頭，腳本會自動讀取該路徑檔案的內容並寫入試算表。
```bash
node skills/characters/update/script.js "角色名稱" "背景資訊 (Markdown)" "@temp_draft.md"
```

## 注意事項
- 此操作僅更新試算表，需執行 `wiki/sync` 才能反映在 Wiki 網頁端。
- 注入檔案時，請確保檔案路徑正確。

# Kairos 匯入格式規格（kairos-deck v1）

匯入頁面：`/import`。任何 AI 工具只要能輸出以下 JSON，即可一鍵匯入。

## 標準格式

```json
{
  "format": "kairos-deck",
  "version": 1,
  "title": "學習集標題",
  "description": "一句話描述",
  "cards": [
    {
      "term": "詞語（原文語言）",
      "definition": "定義（繁體中文）",
      "termLang": "en",
      "defLang": "zh-TW"
    }
  ]
}
```

| 欄位 | 必填 | 說明 |
|---|---|---|
| `format` | 否 | 固定 `"kairos-deck"`（保留欄位，目前不驗證） |
| `version` | 否 | 數字 `1` |
| `title` | 建議 | 缺落時使用「匯入的學習集」 |
| `description` | 否 | 學習集描述 |
| `cards` | ✅ | 至少一張卡片 |

### 卡片欄位

| 欄位 | 必填 | 別名（自動辨識） |
|---|---|---|
| `term` | ✅ | `front`、`word`、`side1`、`詞語`、`詞` |
| `definition` | ✅ | `back`、`meaning`、`side2`、`定義`、`解釋` |
| `termLang` | 否 | `lang` — BCP-47 代碼（`en`/`ja`/`ko`/`fr`…） |
| `defLang` | 否 | — |

## 相容的其他形狀

解析器刻意寬鬆，以下全部可接受：

- **裸陣列**：`[{ "term": "...", "definition": "..." }, ...]`
- **Tuple**：`[["ciao", "你好"], ["grazie", "謝謝"]]`
- **純物件映射**：`{ "ciao": "你好", "grazie": "謝謝" }`
- **TSV 純文字**（非 JSON 時自動 fallback）：每行 `詞語<Tab>定義`

字串會自動 trim；空字串視同缺少該欄位。

## 給 AI 工具的標準提示詞

見 `/import` 頁面的「複製提示詞」按鈕（原始碼：`src/app/import/page.tsx` 的 `AI_PROMPT`）。
核心要求 AI：影片/圖片/PDF → 只輸出上述 JSON、term 保持原文、definition 用繁體中文、
`termLang` 使用 BCP-47。

## 實作位置

- 解析器：`src/lib/import-parser.ts`（含單元測試 `import-parser.test.ts`）
- 匯入頁面：`src/app/import/page.tsx` → 呼叫 `POST /api/decks`（原子式建立學習集+卡片）

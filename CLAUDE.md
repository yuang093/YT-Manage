# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開發指令

```bash
npm run dev      # 啟動開發伺服器 (http://localhost:5173)
npm run build    # 建置生產版本到 dist/
npm run lint     # 執行 ESLint 檢查
npm run preview  # 預覽建置結果
```

## 架構說明

### 元件結構
- **App.jsx** 是核心檔案 (1200+ 行)，包含幾乎所有業務邏輯和 UI
- 獨立元件位於 `src/components/` 但多數**尚未被 App.jsx 使用**
- `components/Player/PlayerView.jsx` 是獨立的 Player 元件，但 App.jsx 在 line 145 定義了自己的內嵌版本，Vercel 部署使用的是 App.jsx 內的版本

### 自訂 Hooks (src/hooks/)
- `useFirebase.js` - Firebase Firestore CRUD 操作封裝
- `useFavorites.js` - 收藏功能 + localStorage 持久化
- `useHistory.js` - 播放歷史記錄
- `useNotification.js` - 通知系統

### Context (src/context/)
- `ThemeContext.jsx` - 深色模式切換
- `NotificationContext.jsx` - 全域通知機制

### Utilities (src/utils/)
- `youtube.js` - YouTube ID 解析、縮圖、標題取得
- `format.js` - 日期和時間格式化
- `csv.js` - CSV 匯入/匯出

### 部署
- Vercel 自動從 GitHub `main` branch 部署
- 部署 URL: https://yt-manage.vercel.app
- 觸發重新部署後約需 1-2 分鐘完成

### 版本管理
- **每次 commit 前必須更新版本號**（Header.jsx 中的 Vxx.x）
- 版本格式：V18.1 → V18.2 → V18.3 ...
- 用戶需要能看到版本變動來確認更新是否生效
- 例行性：先改版本號，再 commit，这样不会忘记

### 重要提醒
- 修改 PlayerView 控制列樣式時，**必須改 App.jsx** (line 802-1016 區域)，而非 components/Player/PlayerView.jsx
- 所有修改完成後需 commit + push 才會觸發 Vercel 部署

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

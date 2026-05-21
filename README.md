# YT 管理大師

> YouTube 播放清單管理工具，輕鬆整理、播放你的最愛影片

**版本**：V19.6 | **部署**：https://yt-manage.vercel.app

---

## 📋 功能特色

### 核心功能
| 功能 | 說明 |
|------|------|
| 🎵 **播放清單管理** | 支援單一曲線和播放清單（多首歌曲） |
| ☁️ **雲端儲存** | Firebase Firestore 即時同步 |
| ▶️ **網頁播放器** | 內建 YouTube IFrame 播放器 |
| ❤️ **收藏功能** | 一鍵收藏最愛項目 |
| 📜 **播放歷史** | 記錄最近播放的 20 首歌曲 |
| 📊 **統計面板** | 顯示瀏覽次數、下載次數等 |

### UI/UX 功能
| 功能 | 說明 |
|------|------|
| 🌙 **深色模式** | 一鍵切換深色/淺色主題 |
| ⏰ **自動深夜模式** | 22:00-06:00 自動切換暗色 |
| 🔍 **搜尋過濾** | 依標題、分類即時搜尋 |
| 📁 **排序功能** | 依時間、標題、瀏覽量排序 |
| 📥 **CSV 匯入/匯出** | 批次管理你的播放清單 |

### 後台管理
| 功能 | 說明 |
|------|------|
| ✏️ **編輯項目** | 修改標題、說明、內容 |
| 🗑️ **刪除項目** | 支援單一刪除和批量刪除 |
| ⬆️ **匯入 CSV** | 批次新增項目 |
| ⬇️ **匯出 CSV** | 備份你的資料庫 |

---

## 🛠️ 技術架構

| 技術 | 名稱 |
|------|------|
| ⚛️ **前端框架** | React 19 |
| 🔧 **建置工具** | Vite (rolldown-vite) |
| 🎨 **樣式框架** | TailwindCSS 3.4 |
| ☁️ **資料庫** | Firebase Firestore |
| 🎬 **播放器** | YouTube IFrame API |
| 🔔 **圖示庫** | Lucide React |

### 專案結構

```
yt-manage/
├── src/
│   ├── App.jsx              # 主應用程式 (核心邏輯)
│   ├── components/
│   │   ├── Header/          # 導航列
│   │   ├── Dashboard/       # 主儀表板
│   │   ├── Form/            # 新增/編輯表單
│   │   ├── Admin/           # 後台管理
│   │   └── Login/           # 管理員登入
│   ├── hooks/               # 自訂 Hooks
│   │   ├── useFirebase.js   # Firebase CRUD
│   │   ├── useFavorites.js  # 收藏功能
│   │   ├── useHistory.js    # 播放歷史
│   │   └── useNotification.js # 通知系統
│   ├── context/             # React Context
│   │   ├── ThemeContext.jsx  # 深色模式
│   │   └── NotificationContext.jsx # 通知
│   └── utils/                # 工具函式
│       ├── youtube.js       # YouTube 解析
│       ├── format.js        # 格式化
│       └── csv.js           # CSV 處理
├── dist/                    # 生產建置
└── public/                  # 靜態資源
```

---

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

啟動後開啟 http://localhost:5173

### 建置生產版本

```bash
npm run build
```

### 程式碼檢查

```bash
npm run lint
```

### 預覽建置結果

```bash
npm run preview
```

---

## 🌐 開發指令對照

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置生產版本 |
| `npm run lint` | ESLint 檢查 |
| `npm run preview` | 預覽建置結果 |

---

## 📝 資料格式 (CSV)

匯入 CSV 格式：

```csv
title,description,type,url
歌曲標題,說明文字,single,https://www.youtube.com/watch?v=...
播放清單標題,說明文字,playlist,"https://www.youtube.com/watch?v=...,https://..."
```

---

## ⚙️ 版本管理

每次 commit 前請更新版本號：

1. 修改 `src/components/Header/Header.jsx` 中的版本號（如 V19.1 → V19.2）
2. Commit 並 Push 觸發 Vercel 自動部署

---

## 🔗 相關連結

- **線上使用**：https://yt-manage.vercel.app
- **斗內連結**：https://service.jkopay.com/r/transfer?j=Transfer:901055756

---

## 📄 授權

本專案僅供個人使用。

---

## 🔧 開發紀錄

### V19.6 (2026-05-21)
- ✅ 修復 ENDE 事件後不跳轉問題
- ✅ 簡化跳轉邏輯，直接呼叫 next()
- ✅ 行動裝置 autoplay=0 等待使用者互動
- ⏳ 待測試：電腦/手機播放清單自動跳下一首
- ⏳ 待測試：手機手動播放有聲音自動播放沒聲音

### V19.5 (2026-05-21)
- ✅ 加入停滯偵測（連續 3 次時間沒變）
- ✅ 快播完時主動跳下一首

### V19.4 (2026-05-21)
- ✅ 修復電腦版自動播放沒聲音問題

### V19.3 (2026-05-21)
- ✅ Phase 1: 背景分頁跳轉修復（endedAtRef, isTransitioningRef）
- ✅ Phase 2: 手機自動播放修復（mute: 1, needsUserGesture）
- ✅ Phase 3: 手機音量控制（隱藏滑桿，顯示提示）
- ✅ Phase 4: 按鈕狀態同步（立即更新 UI + 延遲播放）

### V19.2 (2026-05-19)
- ✅ visibilitychange 事件監聽
- ✅ 背景分頁恢復時檢查播放進度

### V19.1 (2026-05-14)
- ✅ 骨架屏元件
- ✅ 圖片延遲載入
- ✅ 程式碼分割優化
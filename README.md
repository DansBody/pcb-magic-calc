# PCB Cost Calculator

一個功能強大的 PCB（印刷電路板）成本計算工具，支援多供應商比較、成本分解分析和 Part Number 管理。

## 專案簡介

PCB Cost Calculator 是一個專為 PCB 製造業設計的成本計算應用程式，幫助工程師和採購人員快速比較不同供應商的報價，並進行詳細的成本分析。

## 主要功能

### 🧮 PCB 成本計算
- **多供應商比較**：同時比較多個供應商的報價
- **詳細規格設定**：
  - PCB 層數（2/4/6層）
  - 表面處理（OSP、HASL、ENIG 等）
  - 材料類型（TG140℃、TG150℃、TG170℃ 等）
  - 板厚、最小孔徑、防焊顏色
  - 內外層銅厚、線寬/線距
  - V-Cut、特殊疊構、特殊製程
- **面積計算**：支援連板尺寸和板材利用率計算
- **成本分解**：詳細顯示各項成本組成

### 📦 Part Number 管理
- **CRUD 操作**：新增、編輯、刪除 Part Number
- **搜尋功能**：快速搜尋 Part Number
- **匯入/匯出**：支援 JSON 格式的資料匯入和匯出
- **多幣別支援**：支援人民幣（RMB）和美元（USD）

### 📊 成本分析
- **供應商比較表**：並排比較各供應商報價
- **成本分解圖表**：視覺化顯示成本組成
- **詳細計算邏輯**：顯示各項加價和計算公式

## 技術棧

- **前端框架**：React 18
- **開發工具**：Vite
- **程式語言**：TypeScript
- **UI 框架**：shadcn-ui + Tailwind CSS
- **路由**：React Router DOM
- **狀態管理**：TanStack Query
- **表單處理**：React Hook Form + Zod
- **圖表**：Recharts

## 開始使用

### 環境需求

- Node.js 18+ 
- npm 或 yarn 或 bun

### 安裝步驟

```sh
# 1. 複製專案
git clone <YOUR_GIT_URL>

# 2. 進入專案目錄
cd pcb-magic-calc

# 3. 安裝依賴套件
npm install

# 4. 啟動開發伺服器
npm run dev
```

開發伺服器啟動後，在瀏覽器中開啟 `http://localhost:5173` 即可使用。

### 其他指令

```sh
# 建置生產版本
npm run build

# 預覽生產版本
npm run preview

# 執行 ESLint 檢查
npm run lint
```

## 專案結構

```
pcb-magic-calc/
├── src/
│   ├── components/          # React 組件
│   │   ├── PCBCalculator.tsx    # 主要計算器組件
│   │   ├── CostBreakdown.tsx    # 成本分解組件
│   │   ├── SupplierComparison.tsx # 供應商比較組件
│   │   └── ui/              # shadcn-ui 組件
│   ├── pages/               # 頁面組件
│   │   ├── Index.tsx        # 首頁
│   │   └── PartNumberManagement.tsx # Part Number 管理頁面
│   ├── utils/               # 工具函數
│   │   ├── costCalculator.ts    # 成本計算邏輯
│   │   └── partNumberStorage.ts # Part Number 儲存管理
│   ├── data/                # 資料檔案
│   │   └── pcbData.ts      # PCB 規格和供應商資料
│   ├── types/               # TypeScript 類型定義
│   └── hooks/               # 自訂 Hooks
├── public/                  # 靜態資源
└── package.json
```

## 使用說明

### 計算 PCB 成本

1. 在首頁選擇或輸入 Part Number（可選）
2. 設定 PCB 基本規格（層數、表面處理、材料類型等）
3. 調整進階設定（孔徑、銅厚、線寬線距等）
4. 輸入面積和數量
5. 查看右側的供應商比較和成本分解結果

### 管理 Part Number

1. 點擊右上角的「Part Number 管理」按鈕
2. 使用「新增」按鈕建立新的 Part Number
3. 使用搜尋框快速找到特定 Part Number
4. 點擊編輯或刪除按鈕管理現有資料
5. 使用匯入/匯出功能備份或還原資料

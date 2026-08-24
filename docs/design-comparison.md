# 設計稿 vs 實作 比對報告

依 `layout.pen`(Pencil MCP 讀取)逐頁比對 Desktop 版;Mobile 版共用元件已抽查。
圖例:❌ 不一致 | ⚠️ 輕微差異/待確認 | ✓ 一致

> **2025-XX 更新**:除「Logo(G6/L3/D3 圖檔)」與「NavBar 桌面漢堡+logo」外,
> 下列問題均已修正(含使用者決策:主次鈕照設計、學習模式橫排選項、
> 「學員」→「學習」、區塊標題維持中文)。詳見 git log。

---

## 全域問題(影響全站)

| # | 問題 | 設計 | 實作 |
|---|---|---|---|
| G1 | ❌ 按鈕圓角 | 所有按鈕皆全圓 pill(`r=999`) | `Button` 用 `rounded-lg`(8px),各頁手寫按鈕也多是 `rounded-lg` |
| G2 | ❌ NavBar 高度/留白 | 高 64、左右 pad 20 | `h-14`(56)、`lg:px-8`(32) |
| G3 | ❌ NavBar 桌面左側 | 漢堡鈕 + logo 圖片 | 桌面無漢堡(`lg:hidden`)、無 logo |
| G4 | ❌ NavBar 右側 | 建立鈕 40×40 金方塊、頭像 36×36 灰底 `#6A6963` 白字 | 建立鈕 32×32、頭像 32×32 深藍底 |
| G5 | ⚠️ Navbar 搜尋 | 置中 pill 白底 SearchBar(480 寬) | `max-w-md` 帶邊框連結式,非 pill |
| G6 | ❌ Logo | 多處使用 `images/logo.png` 圖片(Sidebar/NavBar/Login/MobileNav)| 全部用「金方塊+閃電 font-awesome icon」代替,**repo 內沒有 logo 圖檔** |
| G7 | ❌ Sidebar 品牌字色 | 「Kairos」`#EADCC5` 米白 | `#D4AF37` 金色 |
| G8 | ❌ SidebarItem/Active 字色 | icon+字=`#D4AF37` 金 | `#EADCC5` 米白 |
| G9 | ⚠️ SidebarSectionTitle | Inter 11/600 `#9A9A94` | `text-xs` `#EADCC5/50` |
| G10 | ❌ Modal 標題字體 | Cormorant Garamond 24/700 | sans `text-lg font-semibold` |
| G11 | ⚠️ Input label | Inter 13/500 | `text-sm`(14)/medium |

> 註:設計稿區塊標題多為英文("Jump back in"、"Recents"),實作為中文。因 tagline 為中文,推測英文是設計稿佔位,**建議維持中文**,以下不再重複列出。

---

## 00 Login(`src/app/login/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| L1 | ❌ 標題「歡迎來到 Kairos」 | Cormorant 28/700 `#0D2275` | sans 18/600 `#1A1A1A` |
| L2 | ❌ 缺副標 | 「輸入你的使用者名稱以開始學習」Inter 14 `#4A5568` | 無 |
| L3 | ❌ Logo 區 | logo.png 64×64 + Kairos(Cormorant 48/700)+ tagline Inter 16 | 金方塊 bolt + Kairos 36px + tagline 14px |
| L4 | ⚠️ 白卡寬度 | 400 | `max-w-sm`=384 |
| L5 | ⚠️ 表格間距 | gap 24 | `space-y-4`(16) |

## 01 Dashboard(`src/app/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| D1 | ❌ Jump 卡標題 | Inter 18/600 | 16px |
| D2 | ❌ Jump 卡 meta | 「1/33 cards reviewed」13px `#6A6963`(顯示**複習進度**) | 「33 張卡片」12px `#9A9A94`(無進度語意) |
| D3 | ❌ 熱門格線 | 4 欄(每卡 266px) | `sm:2 lg:3` 欄 |
| D4 | ⚠️ 熱門/meta 格式 | 「10 cards · by 作者」 | 「N cards · 更新日期」(DTO 無 author 欄位) |
| D5 | ⚠️ Recents 列 | SetListItem:title 16/600、meta 13 `#6A6963` | title 14、meta 12 `#9A9A94` |

## 02 Search Results(`src/app/search/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| S1 | ❌ 頁內搜尋框 | pill 白底無邊框(SearchBar) | `rounded-xl` 帶邊框 |
| S2 | ❌ Tab 樣式 | 純文字(active 深/inactive 灰) | 金底 pill |
| S3 | ❌ 缺排序鈕 | 右側 Button/Ghost | 無 |
| S4 | ⚠️ 結果列間距 | gap 16、SetListItem 樣式 | `space-y-2`(8)、自訂列 |

## 03 Library(`src/app/library/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| B1 | S2/S4 同上 | — | — |

## 04 Folder Detail(`src/app/folders/[folderId]/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| F1 | ❌ 缺 moreBtn | 標題右 IconButton(MoreDropdown:編輯/從側欄移除/刪除) | 無 |
| F2 | ❌ meta 行 | 「3 個學習集 · 建立於 …」14px `#6A6963` | 只建立於,`#9A9A94` |
| F3 | ❌ 缺 tab 列「+」鈕 | 全部 tab 旁有 add 按鈕 | 無 |
| F4 | ❌ 缺 sortRow | 排序鈕 + 240px 白底搜尋框 | 無 |
| F5 | ❌ 底部動作列 | 白色容器(pad12/8)內 Secondary「學習」+ Primary「新增學習集」 | 無容器;按鈕文字「學員」+「新增學習集」 |
| F6 | ⚠️ 列表間距 | gap 12 | 8 |

## 05 Set Detail(`src/app/decks/[deckId]/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| T1 | ❌ metaRow 結構 | 同行:作者(600/#1A1A1A)· 詞語數 · LanguageSelector | 分兩處;無作者;語言選擇器獨立區塊 |
| T2 | ❌ StudyModeCard | 白卡 r12、icon 方塊 36(gold 20% 底)+ label 14/600,一律可點 | pill 式 border 按鈕、disabled 半透明 |
| T3 | ⚠️ 預覽卡 icons | 左上:喇叭+星星 | 右上:只有喇叭;缺「預覽」section label |
| T4 | ❌ WordRow 結構 | 無卡片底、pad14/0;左側喇叭+星 icon →term(14/500)→def(14 `#6A6963`) | 白色圓角卡、中直線分隔、喇叭在右 |

## 06 Flashcards(`src/app/decks/[deckId]/flashcards/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| C1 | ⚠️ topRight | shuffle(Ghost)+ settings icon | 只有 shuffle 文字鈕 |
| C2 | ⚠️ 計數 badge | 28×28 方形色塊 | 圓形+外框 |
| C3 | ❌ 底部列左鍵 | play(發音播放) | rotate-left(回上一張) |
| C4 | ❌ 缺「追蹤進度」開關 | label + 40×22 toggle | 只有文字 |

## 07 Learn(`src/app/decks/[deckId]/learn/page.tsx`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| E1 | ❌ 選項排列 | **橫排** pill(130×48,gap12,選中 `#D4AF3715`) | 直排全寬按鈕 |
| E2 | ⚠️ 不知道嗎?位置 | 選項同行尾端 | 下方獨立按鈕 |
| 其餘(topbar/question card/speaker)✓ | | | |

## 08 Test(`src/app/decks/[deckId]/test/page.tsx`)

整體最接近 ✓。僅:
| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| Q1 | ⚠️ 選擇題選項 | pill 無 radio 圓點 | 自製 radio 圓點 |
| Q2 | ⚠️ 是非題 | 用 Button 元件(Secondary/Primary) | border 按鈕 |

## 09 Match(`src/app/decks/[deckId]/match/page.tsx`)

幾乎一致 ✓。僅:
| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| M1 | ⚠️ tile 邊框 | 純底色無邊框 | 帶 `border-[#D5C8B2]` |
| M2 | ⚠️ matched 態 | 綠底 `#2D6A4F15` | 加 opacity-50+外框+✓ |

## 10 Create Set(`src/app/decks/new/page.tsx` + `DeckForm`)

| # | 項目 | 設計 | 實作 |
|---|---|---|---|
| N1 | ❌ 送出鈕文字色 | Button/Primary 字=`#1A1A1A` | 自訂鈕 `text-white` |
| N2 | ❌ 底部主次鈕順序 | Secondary(建立)+ **Primary**(建立與練習) | Primary(建立)+ Secondary(建立與練習)→ 主次相反,**需討論** |
| N3 | ⚠️ topBar 標題 | Cormorant 24/700 | display 20/bold |
| N4 | ⚠️ 說明欄 | InputGroup 單行輸入框 | textarea rows=2 |

## 11 Create Folder(`src/app/folders/page.tsx` Modal)

結構幾乎一致 ✓。僅 G10(modal 標題字體)、icon 底色 `3715` vs `3720`(微)。

---

## 待用戶決策

1. **G6 logo 圖檔**:設計引用 `images/logo.png`,repo 沒有此檔。要提供正式 logo,還是保留閃電 placeholder?
2. **N2 主次鈕**:「建立」與「建立與練習」哪個該是金色主鈕?(設計稿:建立與練習)
3. **E1 學習模式選項**:設計為橫排 pill,長定義會爆版;要跟設計還是維持直排?
4. **F5 底部列**:設計按鈕文字待確認(「學習」vs 實作「學員」)。
5. **T2/T4**:StudyModeCard 與 WordRow 要照設計重刻嗎?

## 建議修正優先序

1. G1 按鈕 pill 化(改 `Button` 一處+少數手寫鈕)— 全站觀感
2. G7/G8 Sidebar 顏色(兩行 class)
3. L1/L2、S1-S3、F1-F5(各頁缺漏元素)
4. T2/T4、C3/C4、D1-D3(元件級重刻)
5. G2-G5 NavBar 尺寸/內容

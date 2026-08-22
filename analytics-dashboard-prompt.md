# FJU STELLAR 社團適性測驗 — 後台監測數據 實作 Prompt

> 用法：在 `fju_club_test` 專案根目錄開 Claude Code，把下面 `---` 之間的全部內容貼進去。
> 建議分三次貼（Phase 1 → 2 → 3），一次做完一個階段再往下，比較好驗收。

---

## 專案現況（我已掃描過，不用重新猜）

- Next.js 16 App Router + React 19 + Supabase + Tailwind v4 + Recharts + motion
- 流程：`/`（輸入學號 → 解析系所/年級 → 暱稱）→ `/test`（6 題單選）→ `POST /api/submit` → `/result?id=`
- `src/lib/scoring.ts`：每題選項對應 7 個社團類別之一，累加後取最高分；**平手時取排序後第一個**
- 資料表只有三張：
  - `questions(id, content, options jsonb, order_num)`
  - `submissions(id, student_id, department, answers jsonb, scores jsonb, result, created_at)`
  - `messages(id, content, result_category, created_at)`（結果頁彈幕）
- 現有後台 `/admin/dashboard`：只有 4 個 KPI（總數、今日、最多結果、系所數）+ 結果圓餅、14 天趨勢、系所 Top10、年級、部別、明細表
- **目前完全沒有任何事件追蹤**：不知道有多少人看了首頁沒開始、第幾題流失、花多久作答、有沒有分享

### 現在後台缺的東西（這次要補）

1. 沒有漏斗與流失率 → 不知道測驗哪裡卡住
2. 沒有逐題數據 → `answers` 已經存在 DB 裡卻沒被分析
3. 沒有作答時間 → 無法判斷是否有人亂點
4. 沒有分享/彈幕/排行榜的互動數據 → 不知道傳播效果
5. 沒有來源與裝置 → 不知道 IG 限動 vs 系上群組哪個有效
6. 重複作答沒有區分（`submissions` 同一 `student_id` 可以有多筆，`/api/leaderboard` 有去重、dashboard 沒有）
7. 學號輸入失敗率沒有記錄 → 不知道有多少人卡在第一關
8. 沒有匯出功能，社團招生要用資料時只能查 DB

---

# Phase 1 — 先榨乾現有資料（不動前端、不動 schema）

只改 `/admin/dashboard`，用已經存進 `submissions.answers` / `scores` 的資料算出新指標。

### 1-1 KPI 列改成（8 格）

| KPI | 定義 |
|---|---|
| 總作答次數 | `submissions` 筆數 |
| 獨立參與人數 | distinct `student_id` |
| 今日新增 | 今天的作答次數 |
| 重複作答率 | (總次數 − 獨立人數) / 總次數 |
| 涵蓋系所數 | distinct 系所 / 全校 58 系（顯示 `32 / 58`） |
| 平手判定率 | `scores` 中最高分並列 ≥2 類的比例 ← **重要，代表題目鑑別度不足** |
| 尖峰時段 | 作答數最多的小時（例：`21:00–22:00`） |
| 近 7 日 vs 前 7 日 | 成長率 % |

### 1-2 新增區塊：逐題選項分佈

從 `questions.options` + `submissions.answers` 計算，每題畫一組橫向長條：

- 每題 4 個選項各自的選擇人數與百分比，標上該選項對應的社團類別與顏色（沿用 `CLUB_COLORS`）
- 每題標一個「偏態指標」：最高選項佔比 − 25%（越高代表這題越沒有鑑別力）
- 未作答（`answers` 缺該題 id）的比例也要顯示

### 1-3 新增區塊：結果分佈的健康度

- 現有圓餅保留，但加上「理想均勻線 14.3%」的對照
- 列出每個類別的實際 % 與偏離度，偏離超過 ±10pp 的用警示色
- 「平手組合 Top 5」：例如 `藝術性社團 / 音樂性社團` 平手 23 次

### 1-4 新增區塊：時段熱力圖

7（週一~週日）× 24（小時）的 heatmap，格子深淺 = 作答數。用來決定下一波宣傳什麼時候發。

### 1-5 明細表升級

- 加上搜尋（學號 / 系所）、結果類別篩選、日期區間篩選
- 加「匯出 CSV」按鈕（走 `/api/admin/export`，需 admin session）
- 表格分頁，預設 50 筆
- **學號顯示遮罩**（`4110xxxx26`），要看完整值需點「顯示」，並在 UI 註明這是個資

### Phase 1 驗收

- [ ] 上面所有數字都是從既有資料算出來的，沒有新增任何資料表
- [ ] dashboard 在 0 筆資料時不會炸（所有除法都要防 0）
- [ ] 3000 筆資料下 SSR 時間 < 1.5s；若超過就把彙總改成 Supabase RPC / SQL view，不要在 Node 端 loop 全表

---

# Phase 2 — 加事件追蹤（漏斗、時間、互動）

### 2-1 新資料表

```sql
create table if not exists analytics_events (
  id          bigserial primary key,
  event       text not null,
  session_id  uuid not null,          -- 前端產生，存 sessionStorage
  student_id  text,                   -- 有的話才填
  props       jsonb not null default '{}'::jsonb,
  path        text,
  referrer    text,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  device      text,                   -- mobile | tablet | desktop
  os          text,
  browser     text,
  created_at  timestamptz not null default now()
);

create index on analytics_events (event, created_at desc);
create index on analytics_events (session_id, created_at);
create index on analytics_events (created_at desc);

alter table analytics_events enable row level security;
create policy "service role only" on analytics_events
  for all using (auth.role() = 'service_role');
```

不要開匿名 insert 權限，一律走 `POST /api/track`（server 端用 service client 寫入，順便從 `user-agent` 解析 device/os/browser、從 `referer` 補 referrer）。

### 2-2 事件清單（照這個命名，不要自己發明）

| 事件 | 觸發點 | props |
|---|---|---|
| `page_view` | 每頁載入 | `path` |
| `student_id_submit` | 首頁送出學號 | `ok`, `error` (`format`/`unknown_dept`/`empty`) |
| `repeat_detected` | `/api/check-student` 回傳 found | `prev_result` |
| `repeat_choice` | 選擇看舊結果 or 重測 | `choice: view_previous \| retake` |
| `test_start` | 進入 `/test` 且題目載入完成 | `question_count` |
| `question_view` | 每題顯示 | `q_index`, `question_id` |
| `question_answer` | 點選項 | `q_index`, `question_id`, `option`, `changed`(bool), `dwell_ms` |
| `question_back` | 按上一題 | `from_index` |
| `submit_click` | 按送出 | `answered_count` |
| `submit_success` | API 200 | `submission_id`, `result`, `total_duration_ms` |
| `submit_error` | API 非 200 | `status`, `message` |
| `result_view` | 進入 `/result` | `result`, `source: submit \| link \| previous` |
| `club_list_expand` | 展開社團清單 | `result` |
| `share_click` | 按分享/下載卡片 | `result` |
| `share_result` | 分享完成或取消 | `method: native \| download`, `ok` |
| `danmaku_toggle` | 開關彈幕 | `on` |
| `danmaku_send` | 送出彈幕 | `length`, `result` |
| `leaderboard_tab` | 切換排行榜分頁 | `tab` |

### 2-3 前端實作要求

- 寫 `src/lib/track.ts`：`track(event, props?)`，內部用 `navigator.sendBeacon` 優先、fallback `fetch(keepalive:true)`
- `session_id`：`sessionStorage` 存一組 uuid，沒有就產生
- **失敗必須靜默**，追蹤壞掉絕不能影響作答流程（全部包 try/catch，不 await 擋 UI）
- UTM 從 `location.search` 讀，存進 sessionStorage 讓後續事件都帶得到
- 逐題 `dwell_ms` 用 `performance.now()` 在 `question_view` 時記時間戳
- 不要送任何 IP、不要送完整 user-agent 到 props、學號只在必要事件帶

### Phase 2 驗收

- [ ] 關掉網路、或讓 `/api/track` 回 500，測驗流程完全不受影響
- [ ] 完整跑一次測驗，DB 裡應該有一條完整的 session：`page_view → student_id_submit → test_start → question_view×6 → question_answer×6 → submit_click → submit_success → result_view`
- [ ] `/api/track` 有基本 rate limit（同 session 每分鐘 120 筆上限）

---

# Phase 3 — 後台加上漏斗與傳播數據

在 `/admin/dashboard` 新增分頁或區塊（維持現有 cyber/terminal 視覺風格與 `CLUB_COLORS`）：

### 3-1 主漏斗

```
首頁瀏覽 → 學號驗證成功 → 開始測驗 → 完成第1題 → 送出 → 看到結果 → 分享
```

每段顯示人數（distinct session）、轉換率、與流失人數。整體完成率放到 KPI。

### 3-2 逐題流失圖

X 軸 Q1~Q6，兩條線：到達該題的 session 數、完成該題的 session 數。標出流失最嚴重的一題。

### 3-3 作答時間

- 平均 / 中位數 / P90 完成時間
- 每題平均停留秒數長條圖
- 異常作答偵測：總時長 < 15 秒、或有題目 < 1 秒 的比例（可能亂點），列出可疑 session 清單

### 3-4 流量來源

- 來源分佈（utm_source / referrer domain / direct）圓餅
- 各來源的完成率比較長條圖 ← 這張最有決策價值
- 裝置（mobile/desktop）、OS、瀏覽器分佈

### 3-5 傳播與互動

- 分享率（share_result ok / result_view）、分享方式（native vs download）
- 分享帶回的流量（referrer 為自家網域或 utm_source=share）
- 彈幕：總則數、每小時則數、平均長度、被過濾（profanity）比例、各結果類別的彈幕數
- 排行榜開啟率與分頁點擊分佈
- 「重測率」：result_view 之後又回到首頁重測的比例

### 3-6 系統健康

- `submit_error` 數量與錯誤訊息 Top 5
- 學號驗證失敗率與失敗原因分佈（`format` / `unknown_dept`）← 直接指向要不要補系所代碼表
- 近 24 小時每小時的 submit 成功率折線

---

## 全域技術限制

- Next.js 16 的 API 與慣例可能和你記得的不同 → 動 route/params/cache 相關的東西前，先讀 `node_modules/next/dist/docs/`
- 沿用現有元件：`SectionCard` / `KpiCard` / `CustomTooltip` / `CLUB_COLORS` / `AXIS_STYLE`，不要引入新的圖表庫（Recharts 就夠）
- Dashboard 頁面維持 `export const dynamic = 'force-dynamic'` + service role 讀取，前端不得直連 `analytics_events`
- 所有彙總邏輯抽到 `src/lib/analytics.ts`，附單元可測的純函式（輸入 rows → 輸出圖表資料）
- TypeScript strict，`npm run lint` 與 `npm run build` 必須通過
- 每個 Phase 結束前跑一次 `npm run build` 並回報實際數字（新增檔案、新增 API、頁面大小變化）

## 個資與合規

- 學號屬個資：後台預設遮罩、CSV 匯出要在檔頭加註用途與保存期限
- `analytics_events` 設定 90 天保存（加一個 `pg_cron` 或 Supabase scheduled function 清舊資料）
- 首頁需要一行說明：「本測驗會蒐集學號與系所以避免重複作答，資料僅用於社團招生統計」

---

## 請先做這件事

不要直接開始寫 Phase 1。先讀完 `src/app/admin/dashboard/`、`src/lib/scoring.ts`、`supabase-schema.sql`，然後回報：

1. Phase 1 中哪些指標你確認用現有資料算得出來、哪些算不出來
2. 你打算怎麼分檔案（列出要新增/修改的檔案清單）
3. 3000 筆資料下的效能疑慮與你的處理方式

我確認後再開始寫程式。

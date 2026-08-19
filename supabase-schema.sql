-- 社團適性測驗 Schema
-- 在 Supabase SQL Editor 執行此檔案

-- 題目表
CREATE TABLE IF NOT EXISTS questions (
  id         SERIAL PRIMARY KEY,
  content    TEXT NOT NULL,
  options    JSONB NOT NULL,
  -- options 格式：
  -- [
  --   {"label": "A", "text": "選項文字", "category": "學術型"},
  --   {"label": "B", "text": "選項文字", "category": "藝術型"},
  --   ...
  -- ]
  order_num  INTEGER NOT NULL DEFAULT 0
);

-- 作答紀錄表
CREATE TABLE IF NOT EXISTS submissions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  TEXT NOT NULL,
  department  TEXT NOT NULL,
  answers     JSONB NOT NULL,   -- {"question_id": "選擇的 label"}
  scores      JSONB NOT NULL,   -- {"學術型": 3, "藝術型": 2, ...}
  result      TEXT NOT NULL,    -- 得分最高的 category
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 設定
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取題目
CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT USING (true);

-- 允許所有人新增作答（anon key）
CREATE POLICY "Anyone can insert submissions"
  ON submissions FOR INSERT WITH CHECK (true);

-- 只有 service role 可以讀取作答（後台統計用）
CREATE POLICY "Service role reads submissions"
  ON submissions FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================
-- 範例題目（請替換成實際題目）
-- ============================================================
INSERT INTO questions (content, options, order_num) VALUES
(
  '在閒暇時間，你最喜歡做什麼？',
  '[
    {"label": "A", "text": "閱讀書籍或研究新知識", "category": "學術型"},
    {"label": "B", "text": "繪畫、音樂或其他創作", "category": "藝術型"},
    {"label": "C", "text": "運動或戶外活動", "category": "體育型"},
    {"label": "D", "text": "參加志工或社區活動", "category": "服務型"}
  ]'::jsonb,
  1
),
(
  '你認為自己最大的優點是？',
  '[
    {"label": "A", "text": "善於分析與邏輯推理", "category": "學術型"},
    {"label": "B", "text": "富有創意與藝術感", "category": "藝術型"},
    {"label": "C", "text": "體力充沛、精力旺盛", "category": "體育型"},
    {"label": "D", "text": "善於傾聽、樂於助人", "category": "服務型"}
  ]'::jsonb,
  2
);

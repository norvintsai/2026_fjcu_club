-- 社團適性測驗 Schema
-- 在 Supabase SQL Editor 執行此檔案

-- 題目表
CREATE TABLE IF NOT EXISTS questions (
  id         SERIAL PRIMARY KEY,
  content    TEXT NOT NULL,
  options    JSONB NOT NULL,
  order_num  INTEGER NOT NULL DEFAULT 0
);

-- 作答紀錄表
CREATE TABLE IF NOT EXISTS submissions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  TEXT NOT NULL,
  department  TEXT NOT NULL,
  answers     JSONB NOT NULL,
  scores      JSONB NOT NULL,
  result      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 設定
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert submissions"
  ON submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role reads submissions"
  ON submissions FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================
-- 正式題目
-- ============================================================
INSERT INTO questions (content, options, order_num) VALUES
(
  '當你駕駛飛船來到一個未知星球，你最想先探索哪裡？',
  '[
    {"label": "A", "text": "充滿古老文獻與宇宙奧秘的圖書館與研究室", "category": "學術性社團"},
    {"label": "B", "text": "外星人聚集的熱鬧市集、派對與休閒娛樂區", "category": "休閒聯誼性社團"},
    {"label": "C", "text": "需要援助、物資缺乏的宇宙邊境弱勢聚落", "category": "服務性社團"},
    {"label": "D", "text": "充滿星際美學、藝術展覽與霓虹光影的藝廊", "category": "藝術性社團"}
  ]'::jsonb,
  1
),
(
  '在漫長的星際航行中，哪一種聲音最能陪伴你的靈魂？',
  '[
    {"label": "A", "text": "宇宙樂團合奏的搖滾節奏與悠揚旋律", "category": "音樂性社團"},
    {"label": "B", "text": "星際競賽場上的歡呼聲與激烈的體能對決", "category": "體能性社團"},
    {"label": "C", "text": "飛船控制中心與各部門協調運作的指揮聲", "category": "其他單位"},
    {"label": "D", "text": "探討宇宙真理與學術思辨的理性討論聲", "category": "學術性社團"}
  ]'::jsonb,
  2
),
(
  '如果要在星際博覽會籌辦大型活動，你最想負責哪個崗位？',
  '[
    {"label": "A", "text": "站上主舞台發光發熱、表演或展示最新創作", "category": "藝術性社團"},
    {"label": "B", "text": "掌控全場動線、體力活或星際運動競賽衝刺", "category": "體能性社團"},
    {"label": "C", "text": "負責後勤總務、行政聯繫與整體星系協調", "category": "其他單位"},
    {"label": "D", "text": "掌控聲光音效、樂器設備或宇宙音響工程", "category": "音樂性社團"}
  ]'::jsonb,
  3
),
(
  '當銀河系面臨突發危機或社會議題時，你的直覺反應是？',
  '[
    {"label": "A", "text": "直接捲起袖子、親自陪伴並給予最溫暖的實質協助", "category": "服務性社團"},
    {"label": "B", "text": "發揮理性思辨，透過數據分析與學術研究找出解答", "category": "學術性社團"},
    {"label": "C", "text": "用藝術創作、音樂或影像把訴求傳達給全宇宙", "category": "藝術性社團"},
    {"label": "D", "text": "串聯星系人脈、組建跨星球團隊號召大家行動", "category": "休閒聯誼性社團"}
  ]'::jsonb,
  4
),
(
  '你希望在這次的星際旅程（大學社團）中獲得最具代表性的收穫是？',
  '[
    {"label": "A", "text": "鍛鍊強健體魄、在跨星球競賽中奪得勝利榮譽", "category": "體能性社團"},
    {"label": "B", "text": "精通一門外星樂器或展現出色的音樂造詣", "category": "音樂性社團"},
    {"label": "C", "text": "結交一群能互相扶持、懂彼此的生死之交", "category": "休閒聯誼性社團"},
    {"label": "D", "text": "掌握星艦行政與組織運作機制、獲得扎實歷練", "category": "其他單位"}
  ]'::jsonb,
  5
),
(
  '如果要用一句話形容你在宇宙中的核心定位，你覺得是？',
  '[
    {"label": "A", "text": "用愛與溫暖擁抱星際的無私奉獻者", "category": "服務性社團"},
    {"label": "B", "text": "追求極致美感與自我表達的星際藝術家", "category": "藝術性社團"},
    {"label": "C", "text": "充滿好奇心與求知欲的銀河系理性探索家", "category": "學術性社團"},
    {"label": "D", "text": "不可或缺的幕後核心與艦隊運作推手", "category": "其他單位"}
  ]'::jsonb,
  6
);

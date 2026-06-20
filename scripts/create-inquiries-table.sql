-- ════════════════════════════════════════════════════════════════
-- 상담 문의 (inquiries) 테이블 생성
-- 실행: Supabase 대시보드 → SQL Editor → 붙여넣고 RUN
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inquiries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  agree_marketing BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','in_progress','done')),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- RLS: 게스트는 INSERT만, 그 외엔 anon으로 SELECT/UPDATE/DELETE 가능
-- (관리자 페이지가 anon key로 동작하므로 — 추후 Supabase Auth로 강화 권장)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone insert inquiry" ON inquiries;
CREATE POLICY "anyone insert inquiry"
  ON inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon can read" ON inquiries;
CREATE POLICY "anon can read"
  ON inquiries FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon can update" ON inquiries;
CREATE POLICY "anon can update"
  ON inquiries FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon can delete" ON inquiries;
CREATE POLICY "anon can delete"
  ON inquiries FOR DELETE
  TO anon, authenticated
  USING (true);

-- 확인
SELECT 'inquiries 테이블 준비 완료' AS msg;

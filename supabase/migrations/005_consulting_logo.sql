-- ============================================================
-- 005_consulting_logo: 컨설팅실적 카드에 발주처 로고 표시
-- ============================================================
-- 적용 방법: Supabase Dashboard → SQL Editor 에 붙여넣고 RUN
-- ============================================================

alter table public.consulting_results
  add column if not exists logo_url text;

comment on column public.consulting_results.logo_url
  is '발주처 회사 로고 (results 버킷 public URL). 비어 있으면 client 이름 기반 자동 매핑 (CLIENT_LOGOS) 시도, 그것도 없으면 teal→blue 그라디언트.';

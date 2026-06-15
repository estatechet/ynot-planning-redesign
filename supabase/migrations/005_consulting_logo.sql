-- ============================================================
-- 005_consulting_logo: 컨설팅실적 카드에 발주처 로고 표시
-- ============================================================
-- 적용 방법: Supabase Dashboard → SQL Editor 에 붙여넣고 RUN
-- (혹은 supabase db push)
-- ============================================================

alter table public.consulting_results
  add column if not exists logo_url text;

comment on column public.consulting_results.logo_url
  is '발주처 회사 로고 (results 버킷 public URL). 비어 있으면 카드에 그라디언트 + 이니셜 표시.';

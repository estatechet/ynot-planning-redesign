-- ============================================================
-- press_releases — 고정(상단 노출) 기능 추가
-- 실행: Supabase Dashboard → SQL Editor 에 붙여넣고 RUN
-- ============================================================

alter table public.press_releases
  add column if not exists is_pinned boolean not null default false;

create index if not exists press_releases_is_pinned_idx
  on public.press_releases (is_pinned)
  where is_pinned = true;

-- ============================================================
-- Storage 버킷 셋업
-- 실행: Supabase Dashboard → SQL Editor에 붙여넣고 RUN
-- (또는 Dashboard → Storage 에서 수동 생성도 가능)
-- ============================================================

-- 1) press 버킷 (보도자료 PDF/DOC) — 공개 읽기
insert into storage.buckets (id, name, public)
values ('press', 'press', true)
on conflict (id) do nothing;

-- 2) results 버킷 (분양실적 이미지) — 공개 읽기
insert into storage.buckets (id, name, public)
values ('results', 'results', true)
on conflict (id) do nothing;

-- ── press 버킷 정책
create policy "press 버킷: 누구나 다운로드"
  on storage.objects for select
  using (bucket_id = 'press');

create policy "press 버킷: 관리자만 업로드"
  on storage.objects for insert
  with check (bucket_id = 'press' and public.is_admin());

create policy "press 버킷: 관리자만 수정"
  on storage.objects for update
  using (bucket_id = 'press' and public.is_admin());

create policy "press 버킷: 관리자만 삭제"
  on storage.objects for delete
  using (bucket_id = 'press' and public.is_admin());

-- ── results 버킷 정책
create policy "results 버킷: 누구나 다운로드"
  on storage.objects for select
  using (bucket_id = 'results');

create policy "results 버킷: 관리자만 업로드"
  on storage.objects for insert
  with check (bucket_id = 'results' and public.is_admin());

create policy "results 버킷: 관리자만 수정"
  on storage.objects for update
  using (bucket_id = 'results' and public.is_admin());

create policy "results 버킷: 관리자만 삭제"
  on storage.objects for delete
  using (bucket_id = 'results' and public.is_admin());

-- ============================================================
-- 보도자료 file_url 일괄 업데이트
-- 기존: 'pdf/4408.pdf' → 새 Storage 공개 URL
-- ============================================================
update public.press_releases
set file_url = 'https://jclrsdeinpglzhntwyqd.supabase.co/storage/v1/object/public/press/'
              || split_part(file_url, '/', 2)
where file_url is not null
  and file_url <> ''
  and file_url like 'pdf/%';

-- 확인
select count(*) as updated_count,
       min(file_url) as sample_url
from public.press_releases
where file_url like 'https://jclrsdeinpglzhntwyqd.supabase.co/storage/%';

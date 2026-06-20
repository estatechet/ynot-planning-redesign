-- ════════════════════════════════════════════════════════════════
-- Biweekly Report 426~429호 (PDF 첨부 포함)
-- PDF는 Vercel Blob에 업로드 완료
-- 실행: Supabase 대시보드 → SQL Editor → 붙여넣고 RUN
-- ════════════════════════════════════════════════════════════════

INSERT INTO press_releases (title, published_at, is_pinned, file_url, file_type)
VALUES
  (
    'Biweekly Report 426호 (부산 권역별 입지 특성과 동향, 인구 구조 변화로 주택시장 재편, 2026년 5월 양도세 중과 유예 종료가 가져올 폭풍전야, 수도권 광역급행철도 GTX 시대의 개막과 주거 지각변동)',
    '2026-04-24',
    false,
    'https://mansi8kzdseexkz1.public.blob.vercel-storage.com/press/biweekly-426.pdf',
    'PDF'
  ),
  (
    'Biweekly Report 427호 (26년 1분기 부산 아파트 시장 실거래가 분석 및 향후 전망, 지식산업센터 주거 전환 정책 전망, 줄어드는 임대차 매물과 서울 전세시장 구조의 변화)',
    '2026-05-08',
    false,
    'https://mansi8kzdseexkz1.public.blob.vercel-storage.com/press/biweekly-427.pdf',
    'PDF'
  ),
  (
    'Biweekly Report 428호 (정책 리스크가 주택시장에 미치는 영향, 가격보다 감정 필코노미가 바꾸는 소비시장, 토지임대부 분양 주택이란?)',
    '2026-05-22',
    false,
    'https://mansi8kzdseexkz1.public.blob.vercel-storage.com/press/biweekly-428.pdf',
    'PDF'
  ),
  (
    'Biweekly Report 429호 (양도세 중과 재개가 바꾼 부동산 시장, 다시 움직이는 서울 집값, 수도권 분양시장의 새로운 변수, 1주택자 장기보유특별공제 개편과 그에 따른 부동산 시장의 파장)',
    '2026-06-05',
    false,
    'https://mansi8kzdseexkz1.public.blob.vercel-storage.com/press/biweekly-429.pdf',
    'PDF'
  );

-- 추가된 4건 확인
SELECT id, title, published_at, file_url FROM press_releases
WHERE title LIKE 'Biweekly Report 42%' AND published_at >= '2026-04-24'
ORDER BY published_at DESC;

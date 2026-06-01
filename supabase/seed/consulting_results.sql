-- 컨설팅실적 SEED (3 건) — result.html 의 consulting 영역에서 추출
truncate public.consulting_results restart identity;

insert into public.consulting_results (legacy_no, project_name, client, period, display_order) values (1, '하남시 감북지구 사업타당성 분석', '사업타당성 분석', '2017 | 500세대 규모 | 완료', 9999);
insert into public.consulting_results (legacy_no, project_name, client, period, display_order) values (2, '경기도 여주 대단지 마케팅 전략 수립', '마케팅 전략', '2016 | 1,640세대 규모 | 완료', 9998);
insert into public.consulting_results (legacy_no, project_name, client, period, display_order) values (3, '제주도 BANA리조트 분양 컨설팅', '분양 컨설팅', '2014 | 리조트 분양대행 | 완료', 9997);

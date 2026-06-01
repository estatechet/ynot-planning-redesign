-- ============================================================
-- 003: 아이디(username) 기반 로그인 지원
-- profiles 테이블에 username 컬럼 추가 + 트리거 업데이트
-- 내부적으로 username + '@ynp.local' 형식의 가짜 이메일을 Auth에 저장
-- ============================================================

alter table public.profiles
  add column if not exists username text unique;

create index if not exists profiles_username_idx on public.profiles (username);

-- 신규 가입 트리거 — username 도 함께 저장
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, real_name, email, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'real_name', '이름미입력'),
    new.email,
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;

-- ============================================================
-- 와이낫플래닝 — 초기 스키마
-- 실행: Supabase Dashboard → SQL Editor에 붙여넣고 RUN
-- ============================================================

-- 1) PROFILES (회원 정보)
-- ------------------------------------------------------------
-- auth.users 와 1:1 매핑. 실명/역할을 분리 보관.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  real_name text not null,
  email text not null unique,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create index on public.profiles (role);

-- 신규 가입 시 profiles 자동 생성 (raw_user_meta_data.real_name 사용)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, real_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'real_name', '이름미입력'),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Q&A (1:1 비공개 문의)
-- ------------------------------------------------------------
create table public.qna (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  status text not null default 'pending' check (status in ('pending','answered')),
  reply text,
  replied_at timestamptz,
  replied_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index on public.qna (user_id, created_at desc);
create index on public.qna (status, created_at desc);

-- 3) PRESS_RELEASES (보도자료)
-- ------------------------------------------------------------
create table public.press_releases (
  id bigserial primary key,
  legacy_no int,                       -- 기존 번호 (마이그레이션용)
  title text not null,
  content text,                        -- 본문 (옵션, 추후 사용)
  published_at date not null,
  file_url text,                       -- Storage 경로 또는 URL
  file_type text,                      -- 'PDF' | 'DOC' | null
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

create index on public.press_releases (published_at desc);
create index on public.press_releases (legacy_no);

-- 4) SALES_RESULTS (분양실적)
-- ------------------------------------------------------------
create table public.sales_results (
  id bigserial primary key,
  legacy_no int,                       -- 기존 result_001 순서
  project_name text not null,          -- 단지명
  description text,                    -- 세대수/위치/비고
  type text not null check (type in ('아파트','오피스텔','상가','기타')),
  thumb_url text,                      -- 이미지 (Storage)
  progress int not null default 100 check (progress between 0 and 100),
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index on public.sales_results (display_order desc, id desc);
create index on public.sales_results (type);

-- 5) CONSULTING_RESULTS (컨설팅실적)
-- ------------------------------------------------------------
create table public.consulting_results (
  id bigserial primary key,
  legacy_no int,
  project_name text not null,
  client text,                         -- 발주처
  period text,                         -- 수행기간
  description text,
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index on public.consulting_results (display_order desc, id desc);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.qna enable row level security;
alter table public.press_releases enable row level security;
alter table public.sales_results enable row level security;
alter table public.consulting_results enable row level security;

-- 관리자 판별 헬퍼
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── profiles 정책
create policy "profiles: 본인 또는 관리자 조회"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: 본인만 수정"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: 관리자만 role 변경 가능"
  on public.profiles for update
  using (public.is_admin());

-- ── qna 정책
create policy "qna: 본인 조회"
  on public.qna for select
  using (auth.uid() = user_id);

create policy "qna: 관리자 전체 조회"
  on public.qna for select
  using (public.is_admin());

create policy "qna: 로그인 사용자 작성"
  on public.qna for insert
  with check (auth.uid() = user_id);

create policy "qna: 관리자만 답변/수정"
  on public.qna for update
  using (public.is_admin());

create policy "qna: 본인 또는 관리자 삭제"
  on public.qna for delete
  using (auth.uid() = user_id or public.is_admin());

-- ── press_releases 정책 (공개 읽기, 관리자 쓰기)
create policy "press: 누구나 조회"
  on public.press_releases for select
  using (true);

create policy "press: 관리자만 INSERT"
  on public.press_releases for insert
  with check (public.is_admin());

create policy "press: 관리자만 UPDATE"
  on public.press_releases for update
  using (public.is_admin());

create policy "press: 관리자만 DELETE"
  on public.press_releases for delete
  using (public.is_admin());

-- ── sales_results 정책
create policy "sales: 공개항목만 조회"
  on public.sales_results for select
  using (is_published or public.is_admin());

create policy "sales: 관리자만 INSERT"
  on public.sales_results for insert
  with check (public.is_admin());

create policy "sales: 관리자만 UPDATE"
  on public.sales_results for update
  using (public.is_admin());

create policy "sales: 관리자만 DELETE"
  on public.sales_results for delete
  using (public.is_admin());

-- ── consulting_results 정책
create policy "consulting: 공개항목만 조회"
  on public.consulting_results for select
  using (is_published or public.is_admin());

create policy "consulting: 관리자만 INSERT"
  on public.consulting_results for insert
  with check (public.is_admin());

create policy "consulting: 관리자만 UPDATE"
  on public.consulting_results for update
  using (public.is_admin());

create policy "consulting: 관리자만 DELETE"
  on public.consulting_results for delete
  using (public.is_admin());

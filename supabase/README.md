# Supabase 셋업 가이드

## 1. 마이그레이션 실행 순서

Supabase Dashboard → **SQL Editor** → 아래 순서로 붙여넣고 RUN

1. `migrations/001_initial_schema.sql` — 테이블 + RLS 정책
2. `migrations/002_storage_buckets.sql` — Storage 버킷 + 정책

## 2. 관리자 계정 생성

마이그레이션 완료 후:

### 방법 A) Dashboard에서 가입 후 role 변경
1. 사이트 `signup.html` 에서 일반 회원으로 가입
2. Supabase Dashboard → **SQL Editor** 에서:

```sql
update public.profiles
set role = 'admin'
where email = '관리자이메일@example.com';
```

### 방법 B) Authentication 메뉴에서 직접 생성
1. Dashboard → **Authentication** → **Users** → **Add user**
2. 이메일/비밀번호 입력 + `User Metadata`에:
   ```json
   {"real_name": "관리자"}
   ```
3. 생성 후 위 SQL 로 role 업데이트

## 3. 환경 변수 (사이트에 사용)

`Project Settings` → `API` 메뉴에서 확인:

- **Project URL**: `https://xxxx.supabase.co`
- **anon / public key**: `eyJhbG...` (공개 가능)
- ⚠️ **service_role key**: 절대 노출 금지 (관리자 백엔드용)

`js/supabase-config.js` 파일에 anon key 만 사용합니다.

## 4. 데이터 마이그레이션

기존 HTML 의 보도자료/실적 데이터를 추출 후 seed:

```bash
node scripts/extract-data.js          # community.html, result.html → JSON
node scripts/upload-data.js           # JSON → Supabase
node scripts/upload-pdfs.js           # /pdf 폴더 → Storage(press 버킷)
node scripts/upload-images.js         # /img/result_* → Storage(results 버킷)
```

(스크립트는 Supabase 셋업 완료 후 작성)

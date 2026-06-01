#!/usr/bin/env node
/**
 * press_releases.file_url 값을 'pdf/XXXX.pdf' → 새 Supabase Storage 공개 URL 로 일괄 업데이트.
 *
 * 사용법:
 *   SUPABASE_SERVICE_KEY="<service_role_key>" node scripts/update-file-urls.js
 */
const SUPA_URL = 'https://jclrsdeinpglzhntwyqd.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_KEY;
const STORAGE_PREFIX = `${SUPA_URL}/storage/v1/object/public/press/`;

if (!KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json'
};

async function fetchAll() {
  // file_url like 'pdf/%' 인 행 모두 조회
  const url = `${SUPA_URL}/rest/v1/press_releases?select=id,file_url&file_url=like.pdf/*`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function updateOne(id, newUrl) {
  const url = `${SUPA_URL}/rest/v1/press_releases?id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ file_url: newUrl })
  });
  if (!res.ok) {
    return { ok: false, err: `${res.status} ${(await res.text()).slice(0, 200)}` };
  }
  return { ok: true };
}

(async function main() {
  const rows = await fetchAll();
  console.log(`📋 업데이트 대상: ${rows.length}건\n`);

  let ok = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < rows.length; i++) {
    const { id, file_url } = rows[i];
    const filename = file_url.split('/')[1]; // 'pdf/4408.pdf' → '4408.pdf'
    if (!filename) { fail++; failed.push({ id, file_url, err: 'no filename' }); continue; }
    const newUrl = STORAGE_PREFIX + filename;

    process.stdout.write(`[${i+1}/${rows.length}] id=${id} ${file_url} → …${filename} ... `);
    const r = await updateOne(id, newUrl);
    if (r.ok) { console.log('✓'); ok++; }
    else      { console.log('✗ ' + r.err); fail++; failed.push({ id, file_url, err: r.err }); }
  }

  console.log(`\n=========================================`);
  console.log(`✅ 성공: ${ok}`);
  console.log(`❌ 실패: ${fail}`);
  if (failed.length) {
    console.log(`\n실패 목록:`);
    failed.forEach(f => console.log(`  - id=${f.id} (${f.file_url}) — ${f.err}`));
  }

  // 확인 쿼리
  const verifyUrl = `${SUPA_URL}/rest/v1/press_releases?select=file_url&file_url=like.${encodeURIComponent(STORAGE_PREFIX)}*&limit=1`;
  const verifyRes = await fetch(verifyUrl, { headers: { ...headers, Prefer: 'count=exact' } });
  const contentRange = verifyRes.headers.get('content-range'); // '0-0/N'
  const total = contentRange ? contentRange.split('/')[1] : '?';
  const sample = await verifyRes.json();
  console.log(`\n🔎 확인: Storage URL 가진 행 총 ${total}건`);
  if (sample[0]) console.log(`   샘플: ${sample[0].file_url}`);
})();

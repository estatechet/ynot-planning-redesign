#!/usr/bin/env node
/**
 * 와이낫플래닝 본 사이트(www.와이낫플래닝.kr) 컨설팅실적 게시판을 모두 스크래핑하여
 * Supabase consulting_results 테이블에 일괄 등록한다.
 *
 * 사용법:
 *   SUPABASE_SERVICE_KEY="<service_role_key>" node scripts/import-consulting.js
 */
const SUPA_URL = 'https://jclrsdeinpglzhntwyqd.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_KEY;
const SRC = 'http://www.xn--t20br5b1zg0os9mbvw5b.kr/bbs/board.php?bo_table=03_02';
const TOTAL_PAGES = 90;

if (!KEY) { console.error('❌ SUPABASE_SERVICE_KEY 필요'); process.exit(1); }

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json'
};

// ── HTML 디코딩 헬퍼 ──
function decode(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/​|﻿|‎|‏|‪-‮/g, '') // zero-width / 방향 제어 제거
    .replace(/​/g, '') // U+200B (zero-width space) – 본문에 들어있음
    .replace(/\s+/g, ' ')
    .trim();
}

// ── 한 페이지 파싱 ──
function parsePage(html) {
  const rows = [];
  // <tr class="">...</tr> 블록을 모두 추출
  const trRe = /<tr class="">([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRe.exec(html)) !== null) {
    const block = m[1];
    // td.num
    const numM = /<td class="num">([\s\S]*?)<\/td>/.exec(block);
    // td.subject (값이 <a> 태그 안에 있음)
    const subjM = /<td class="subject"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)(?:<!--|<\/a>)/.exec(block);
    // td.txt (값이 <a> 태그 안에 있음)
    const txtM = /<td class="txt"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/.exec(block);
    // wr_id
    const idM = /wr_id=(\d+)/.exec(block);

    if (!numM || !txtM) continue;

    const period = decode(numM[1]);
    const client = decode(subjM ? subjM[1] : '');
    const projectName = decode(txtM[1]);
    const wrId = idM ? parseInt(idM[1], 10) : null;

    if (!projectName) continue;

    rows.push({
      legacy_no: wrId,
      period,
      client: client || null,
      project_name: projectName,
      display_order: wrId || 0,
      is_published: true
    });
  }
  return rows;
}

async function fetchPage(page) {
  const url = `${SRC}&page=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`page ${page}: HTTP ${res.status}`);
  return await res.text();
}

(async function main() {
  console.log(`📥 ${SRC} 에서 ${TOTAL_PAGES}페이지 스크래핑\n`);
  const all = [];
  const seen = new Set();

  for (let p = 1; p <= TOTAL_PAGES; p++) {
    process.stdout.write(`  page ${p}/${TOTAL_PAGES} ... `);
    try {
      const html = await fetchPage(p);
      const rows = parsePage(html);
      let added = 0;
      for (const r of rows) {
        if (r.legacy_no && seen.has(r.legacy_no)) continue;
        if (r.legacy_no) seen.add(r.legacy_no);
        all.push(r);
        added++;
      }
      console.log(`${added}건`);
    } catch (e) {
      console.log(`✗ ${e.message}`);
    }
  }

  console.log(`\n📊 총 ${all.length}건 파싱됨\n`);

  if (!all.length) { console.error('파싱된 데이터가 없습니다.'); process.exit(1); }

  // ── 1) 기존 행 삭제 ──
  console.log('🧹 기존 consulting_results 행 전체 삭제…');
  const delRes = await fetch(`${SUPA_URL}/rest/v1/consulting_results?id=gte.0`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' }
  });
  if (!delRes.ok) {
    console.error('❌ 삭제 실패:', delRes.status, await delRes.text());
    process.exit(1);
  }
  console.log('  ✓ 삭제 완료\n');

  // ── 2) 배치 INSERT ──
  const BATCH = 100;
  console.log(`📤 ${BATCH}건씩 배치 업로드…`);
  let ok = 0, fail = 0;
  for (let i = 0; i < all.length; i += BATCH) {
    const slice = all.slice(i, i + BATCH);
    process.stdout.write(`  [${i + 1}-${i + slice.length}] `);
    const res = await fetch(`${SUPA_URL}/rest/v1/consulting_results`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(slice)
    });
    if (res.ok) { ok += slice.length; console.log('✓'); }
    else {
      fail += slice.length;
      console.log('✗ ' + res.status + ' ' + (await res.text()).slice(0, 200));
    }
  }

  console.log(`\n=========================================`);
  console.log(`✅ 등록: ${ok}`);
  console.log(`❌ 실패: ${fail}`);

  // ── 3) 확인 ──
  const verify = await fetch(`${SUPA_URL}/rest/v1/consulting_results?select=count`,
    { headers: { ...headers, Prefer: 'count=exact', Range: '0-0' } });
  const cnt = await verify.json();
  console.log(`\n🔎 DB 총 행 수: ${cnt[0]?.count}`);

  // 샘플 3건
  const sample = await fetch(`${SUPA_URL}/rest/v1/consulting_results?select=period,client,project_name&order=display_order.desc&limit=3`,
    { headers });
  console.log('\n📋 최신 3건:');
  (await sample.json()).forEach(r => {
    console.log(`  - [${r.period}] ${r.client || '-'} | ${r.project_name}`);
  });
})();

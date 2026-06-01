#!/usr/bin/env node
/**
 * 기존 HTML 에서 데이터를 추출해 Supabase 에 넣을 SQL INSERT 문을 생성한다.
 *
 * 사용:
 *   node scripts/extract-data.js
 *
 * 출력:
 *   supabase/seed/press_releases.sql
 *   supabase/seed/sales_results.sql
 *   supabase/seed/consulting_results.sql
 *
 * 의존성: Node.js 기본 모듈만 사용 (별도 설치 없음)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT  = path.join(ROOT, 'supabase', 'seed');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ───── SQL 문자열 escape
const sqlStr = (s) => {
  if (s === null || s === undefined || s === '') return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
};
const sqlNum = (n) => (n === null || n === undefined || n === '') ? 'NULL' : String(n);

// ============================================================
// 1) 보도자료 추출 (community.html 의 REPORTS 배열)
// ============================================================
function extractPress() {
  const html = fs.readFileSync(path.join(ROOT, 'community.html'), 'utf8');

  // const REPORTS = [ ... ];  배열 본문만 잘라낸다
  const m = html.match(/const\s+REPORTS\s*=\s*\[([\s\S]*?)\];/);
  if (!m) throw new Error('REPORTS 배열을 찾을 수 없습니다');

  const body = m[1];
  // 각 줄에 ['no','date','title','file','ext'] 형태로 들어있음
  const rowRe = /\[\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\]/g;
  const rows = [];
  let r;
  while ((r = rowRe.exec(body)) !== null) {
    const [_, no, date, titleRaw, file, ext] = r;
    const title = titleRaw.replace(/\\'/g, "'").replace(/\\"/g, '"');
    rows.push({
      legacy_no: parseInt(no, 10),
      published_at: date,
      title,
      file_url: file || null,
      file_type: ext || null
    });
  }

  console.log(`✓ 보도자료 ${rows.length} 건 추출`);

  const sql = [
    `-- 보도자료 SEED (${rows.length} 건) — community.html 의 REPORTS 배열에서 추출`,
    `-- file_url 은 기존 pdf 폴더의 상대 경로. 추후 Storage 로 이전 시 일괄 UPDATE`,
    `truncate public.press_releases restart identity;`,
    ''
  ];
  rows.forEach((r) => {
    sql.push(
      `insert into public.press_releases (legacy_no, published_at, title, file_url, file_type) ` +
      `values (${sqlNum(r.legacy_no)}, ${sqlStr(r.published_at)}, ${sqlStr(r.title)}, ${sqlStr(r.file_url)}, ${sqlStr(r.file_type)});`
    );
  });

  fs.writeFileSync(path.join(OUT, 'press_releases.sql'), sql.join('\n') + '\n');
  console.log(`  → supabase/seed/press_releases.sql`);
}

// ============================================================
// 2) 분양실적 추출 (result.html 의 <div class="result-card" data-type="...">)
// ============================================================
function extractSales() {
  const html = fs.readFileSync(path.join(ROOT, 'result.html'), 'utf8');

  // sales 영역: <div id="sales" class="tab-pane active"> ... 다음 <div id="consulting"> 직전까지
  const sStart = html.indexOf('<div id="sales"');
  const cStart = html.indexOf('<div id="consulting"');
  if (sStart < 0 || cStart < 0) throw new Error('sales/consulting 섹션 위치를 찾을 수 없음');
  const region = html.slice(sStart, cStart);

  const cardRe = /<div class="result-card"\s+data-type="([^"]+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  const innerRe = {
    thumb: /background-image:url\(['"]?([^'")\s]+)['"]?\)/,
    badge: /<span class="result-badge">([^<]+)<\/span>/,
    title: /<h4>([^<]+)<\/h4>/,
    desc:  /<p>([^<]+)<\/p>/,
    progress: /style="width:(\d+)%"/
  };

  const rows = [];
  let m, idx = 0;
  while ((m = cardRe.exec(region)) !== null) {
    const type = m[1];
    const inner = m[2];
    const thumb = (inner.match(innerRe.thumb) || [])[1] || null;
    const title = ((inner.match(innerRe.title) || [])[1] || '').trim();
    const desc  = ((inner.match(innerRe.desc)  || [])[1] || '').trim();
    const progress = parseInt((inner.match(innerRe.progress) || [])[1] || '100', 10);
    if (!title) continue;
    idx += 1;
    rows.push({
      legacy_no: idx,
      project_name: title,
      description: desc || null,
      type: ['아파트','오피스텔','상가','기타'].includes(type) ? type : '기타',
      thumb_url: thumb,
      progress,
      display_order: 10000 - idx  // 위에서부터 큰 값
    });
  }

  console.log(`✓ 분양실적 ${rows.length} 건 추출`);

  const sql = [
    `-- 분양실적 SEED (${rows.length} 건) — result.html 의 sales 영역에서 추출`,
    `-- thumb_url 은 기존 img/result_*.png 상대 경로. 추후 Storage 로 이전 시 일괄 UPDATE`,
    `truncate public.sales_results restart identity;`,
    ''
  ];
  rows.forEach((r) => {
    sql.push(
      `insert into public.sales_results ` +
      `(legacy_no, project_name, description, type, thumb_url, progress, display_order) ` +
      `values (${sqlNum(r.legacy_no)}, ${sqlStr(r.project_name)}, ${sqlStr(r.description)}, ` +
      `${sqlStr(r.type)}, ${sqlStr(r.thumb_url)}, ${sqlNum(r.progress)}, ${sqlNum(r.display_order)});`
    );
  });

  fs.writeFileSync(path.join(OUT, 'sales_results.sql'), sql.join('\n') + '\n');
  console.log(`  → supabase/seed/sales_results.sql`);
}

// ============================================================
// 3) 컨설팅실적 추출 (result.html 의 <div id="consulting"> 영역)
// ============================================================
function extractConsulting() {
  const html = fs.readFileSync(path.join(ROOT, 'result.html'), 'utf8');

  const cStart = html.indexOf('<div id="consulting"');
  const cEnd   = html.indexOf('</section>', cStart);
  if (cStart < 0) throw new Error('consulting 섹션 위치를 찾을 수 없음');
  const region = html.slice(cStart, cEnd);

  const cardRe = /<div class="result-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  const rows = [];
  let m, idx = 0;
  while ((m = cardRe.exec(region)) !== null) {
    const inner = m[1];
    const badge = ((inner.match(/<span class="result-badge">([^<]+)<\/span>/) || [])[1] || '').trim();
    const title = ((inner.match(/<h4>([^<]+)<\/h4>/) || [])[1] || '').trim();
    const desc  = ((inner.match(/<p>([^<]+)<\/p>/) || [])[1] || '').trim();
    if (!title) continue;
    idx += 1;
    rows.push({
      legacy_no: idx,
      project_name: title,
      client: badge || null,
      period: desc || null,
      display_order: 10000 - idx
    });
  }

  console.log(`✓ 컨설팅실적 ${rows.length} 건 추출`);

  const sql = [
    `-- 컨설팅실적 SEED (${rows.length} 건) — result.html 의 consulting 영역에서 추출`,
    `truncate public.consulting_results restart identity;`,
    ''
  ];
  rows.forEach((r) => {
    sql.push(
      `insert into public.consulting_results ` +
      `(legacy_no, project_name, client, period, display_order) ` +
      `values (${sqlNum(r.legacy_no)}, ${sqlStr(r.project_name)}, ${sqlStr(r.client)}, ${sqlStr(r.period)}, ${sqlNum(r.display_order)});`
    );
  });

  fs.writeFileSync(path.join(OUT, 'consulting_results.sql'), sql.join('\n') + '\n');
  console.log(`  → supabase/seed/consulting_results.sql`);
}

// ───── 실행
try {
  extractPress();
  extractSales();
  extractConsulting();
  console.log('\n✅ 모든 SEED SQL 파일 생성 완료');
  console.log('\n다음 단계: supabase/seed/*.sql 파일을 순서대로 Supabase SQL Editor 에서 실행');
} catch (e) {
  console.error('❌ 추출 실패:', e.message);
  process.exit(1);
}

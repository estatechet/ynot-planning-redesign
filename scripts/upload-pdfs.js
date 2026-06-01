#!/usr/bin/env node
/**
 * 로컬 pdf/ 폴더의 모든 파일을 Supabase Storage의 press 버킷으로 업로드한다.
 *
 * 사용법:
 *   SUPABASE_SERVICE_KEY="<service_role_key>" node scripts/upload-pdfs.js
 *
 * ⚠️ service_role 키는 절대 코드/저장소에 남기지 마세요.
 *    환경변수로만 전달하고, 작업 후 터미널 닫으면 사라집니다.
 */
const fs = require('fs');
const path = require('path');

const SUPA_URL = 'https://jclrsdeinpglzhntwyqd.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'press';
const PDF_DIR = path.join(__dirname, '..', 'pdf');

if (!KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY 환경변수가 필요합니다.');
  console.error('   사용: SUPABASE_SERVICE_KEY="..." node scripts/upload-pdfs.js');
  process.exit(1);
}

const mimeOf = (f) => {
  const ext = f.toLowerCase().split('.').pop();
  return {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }[ext] || 'application/octet-stream';
};

async function uploadOne(filename) {
  const filepath = path.join(PDF_DIR, filename);
  const data = fs.readFileSync(filepath);
  const url = `${SUPA_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': mimeOf(filename),
      'x-upsert': 'true',
      'cache-control': 'public, max-age=31536000, immutable'
    },
    body: data
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, err: `${res.status} ${text.slice(0, 200)}` };
  }
  return { ok: true };
}

(async function main() {
  const files = fs.readdirSync(PDF_DIR).filter(f => !f.startsWith('.'));
  console.log(`📂 pdf/ — ${files.length}개 파일 발견\n`);

  let ok = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    process.stdout.write(`[${i+1}/${files.length}] ${f} ... `);
    const r = await uploadOne(f);
    if (r.ok) { console.log('✓'); ok++; }
    else      { console.log('✗ ' + r.err); fail++; failed.push(f); }
  }

  console.log(`\n=========================================`);
  console.log(`✅ 성공: ${ok}`);
  console.log(`❌ 실패: ${fail}`);
  if (failed.length) {
    console.log(`\n실패한 파일:`);
    failed.forEach(f => console.log(`  - ${f}`));
  }
  console.log(`\n다음 단계 — Supabase SQL Editor 에서 file_url 일괄 업데이트 SQL 실행 필요`);
  console.log(`(scripts/update-file-urls.sql 파일 사용)`);
})();

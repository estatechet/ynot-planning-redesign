#!/usr/bin/env node
/**
 * 모든 정적 HTML 페이지에 Supabase + auth-ui 스크립트를 일괄 삽입한다.
 *  - </body> 직전 <script src="script.js"></script> 다음에 4개 스크립트 추가
 *  - 이미 들어있으면 건너뜀 (멱등)
 */
const fs = require('fs');
const path = require('path');

const pages = ['index.html', 'about.html', 'business.html', 'contact.html', 'recruit.html', 'privacy.html'];
const ROOT = path.join(__dirname, '..');

const INJECT = [
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
  '<script src="js/supabase-config.js?v=2"></script>',
  '<script src="js/supabase-client.js?v=2"></script>',
  '<script src="js/auth-ui.js?v=2"></script>'
].join('\n');

for (const file of pages) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) { console.warn('skip (missing):', file); continue; }
  let html = fs.readFileSync(p, 'utf8');

  if (html.includes('supabase-client.js')) {
    console.log('skip (already injected):', file);
    continue;
  }

  // <script src="script.js"></script> 다음 줄에 삽입
  const target = '<script src="script.js"></script>';
  if (!html.includes(target)) {
    console.warn('skip (script.js not found):', file);
    continue;
  }
  html = html.replace(target, target + '\n' + INJECT);

  fs.writeFileSync(p, html);
  console.log('✓ injected:', file);
}
console.log('\n완료');

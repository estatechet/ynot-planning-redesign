#!/usr/bin/env node
// 모든 HTML 의 js/css 캐시 버전 일괄 업데이트
const fs = require('fs');
const path = require('path');

const NEW_V = '14';
const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const f of files) {
  const p = path.join(dir, f);
  let html = fs.readFileSync(p, 'utf8');
  const orig = html;
  // js ?v= → 새 버전
  html = html.replace(/\.js\?v=\d+/g, `.js?v=${NEW_V}`);
  // style.css → style.css?v=
  html = html.replace(/href="style\.css(\?v=\d+)?"/g, `href="style.css?v=${NEW_V}"`);
  if (html !== orig) {
    fs.writeFileSync(p, html);
    console.log('✓', f);
  }
}
console.log(`완료: ?v=${NEW_V}`);

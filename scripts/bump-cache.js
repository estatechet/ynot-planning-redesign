#!/usr/bin/env node
// 모든 HTML 의 js/css 캐시 버전 일괄 업데이트
const fs = require('fs');
const path = require('path');

const NEW_V = '123';
const root = path.join(__dirname, '..');
const targets = [
  ...fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => path.join(root, f)),
  path.join(root, 'manage', 'index.html'),
];

for (const p of targets) {
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  const orig = html;
  // js ?v= → 새 버전
  html = html.replace(/\.js\?v=\d+/g, `.js?v=${NEW_V}`);
  // style.css → style.css?v=
  html = html.replace(/(href="(?:\.\.\/)?style\.css)(\?v=\d+)?"/g, `$1?v=${NEW_V}"`);
  // B2 리디자인 CSS 도 함께 (2026-09-05 추가)
  html = html.replace(/(href="(?:\.\.\/)?css-b2\.css)(\?v=\d+)?"/g, `$1?v=${NEW_V}"`);
  if (html !== orig) {
    fs.writeFileSync(p, html);
    console.log('✓', path.relative(root, p));
  }
}
console.log(`완료: ?v=${NEW_V}`);

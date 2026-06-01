#!/usr/bin/env node
// 모든 HTML 의 <head> 에 캐시 비활성화 meta 추가 (브라우저가 매번 새로 다운로드)
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const META = [
  '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">',
  '<meta http-equiv="Pragma" content="no-cache">',
  '<meta http-equiv="Expires" content="0">'
].join('\n');

for (const f of files) {
  const p = path.join(dir, f);
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('Cache-Control"')) {
    console.log('skip:', f);
    continue;
  }
  // <meta charset="UTF-8"> 다음에 삽입
  html = html.replace(/(<meta charset="UTF-8">)/i, `$1\n${META}`);
  fs.writeFileSync(p, html);
  console.log('✓', f);
}
console.log('완료');

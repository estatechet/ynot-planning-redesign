#!/usr/bin/env node
// 모든 페이지의 네비바 Q&A 링크를 community.html#qna → mypage.html 로 변경
const fs = require('fs');
const path = require('path');

const pages = ['index.html','about.html','business.html','contact.html','recruit.html','privacy.html','community.html','result.html','auth.html','mypage.html'];
const ROOT = path.join(__dirname, '..');

for (const file of pages) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  const before = html;
  html = html.replace(/href="community\.html#qna"/g, 'href="mypage.html"');
  if (html !== before) {
    fs.writeFileSync(p, html);
    console.log('✓ updated:', file);
  }
}
console.log('완료');

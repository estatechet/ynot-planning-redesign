#!/usr/bin/env node
// 모든 페이지에서:
//  1) 우리가 삽입했던 정적 <li class="nav-auth"> 제거
//  2) "문의하기" nav-cta 를 "Login" (auth.html 로 이동) 으로 교체
const fs = require('fs');
const path = require('path');

const pages = ['index.html','about.html','business.html','contact.html','recruit.html','privacy.html','community.html','result.html','auth.html','mypage.html'];
const ROOT  = path.join(__dirname, '..');

for (const file of pages) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  const orig = html;

  // 1) 정적 nav-auth li 제거
  html = html.replace(/\s*<li class="nav-auth"><a href="auth\.html">[^<]*<\/a><\/li>\s*\n?/g, '\n      ');

  // 2) 문의하기 → Login
  html = html.replace(
    /<li class="nav-cta"><a href="contact\.html"[^>]*>문의하기<\/a><\/li>/g,
    '<li class="nav-cta" id="navCta"><a href="auth.html" id="navCtaLink">Login</a></li>'
  );

  if (html !== orig) {
    fs.writeFileSync(p, html);
    console.log('✓', file);
  } else {
    console.log('— no change:', file);
  }
}
console.log('완료');

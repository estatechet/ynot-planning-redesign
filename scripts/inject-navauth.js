#!/usr/bin/env node
// 모든 정적 페이지의 navbar 에 정적 "로그인 / 가입" li 를 삽입한다.
// JS 가 로드되기 전에도 버튼이 보이도록 fallback.
// auth-ui.js 는 로드 후 이 li 를 제거하고 로그인 상태에 따라 다시 그린다.
const fs = require('fs');
const path = require('path');

const pages = ['index.html','about.html','business.html','contact.html','recruit.html','privacy.html','community.html','result.html','auth.html','mypage.html'];
const ROOT  = path.join(__dirname, '..');

const INJECT = '      <li class="nav-auth"><a href="auth.html">로그인 / 가입</a></li>\n      ';

for (const file of pages) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');

  // 이미 들어 있으면 스킵
  if (/<li class="nav-auth"><a href="auth\.html"/.test(html)) {
    console.log('skip (already):', file);
    continue;
  }

  // <li class="nav-cta"> 직전에 삽입
  const re = /(\s*<li class="nav-cta">)/;
  if (!re.test(html)) { console.warn('skip (no nav-cta):', file); continue; }
  html = html.replace(re, '\n' + INJECT + '$1');
  fs.writeFileSync(p, html);
  console.log('✓ injected:', file);
}
console.log('완료');

// ============================================================
// 모든 페이지 공통 — 네비바의 단일 Login 버튼(nav-cta)을
// 로그인 상태에 따라 동적으로 바꿈
//
// - 비로그인: "Login" → auth.html
// - 로그인 : "{실명}님" → mypage.html (관리자라면 admin/dashboard.html)
//   + 옆에 작은 "로그아웃" 링크 추가
// ============================================================
(function(){
  if (!window.ynpAuth) return;

  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function refresh(){
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    // 이전에 만든 로그아웃 li 제거
    navLinks.querySelectorAll('.nav-logout').forEach(el => el.remove());

    const cta     = navLinks.querySelector('.nav-cta');
    const ctaLink = cta ? cta.querySelector('a') : null;
    if (!cta || !ctaLink) return;

    const profile = await window.ynpAuth.getProfile();

    if (!profile) {
      ctaLink.textContent = 'Login';
      ctaLink.setAttribute('href', 'auth.html');
      return;
    }

    const isAdmin = profile.role === 'admin';
    const name = profile.real_name || profile.username || '회원';
    ctaLink.textContent = isAdmin ? `${name}님 (관리자)` : `${name}님`;
    ctaLink.setAttribute('href', isAdmin ? 'admin/dashboard.html' : 'mypage.html');

    // 로그아웃 링크 (cta 다음에 추가)
    const logoutLi = document.createElement('li');
    logoutLi.className = 'nav-logout';
    logoutLi.innerHTML = `<a href="#" id="ynpLogoutBtn">로그아웃</a>`;
    cta.insertAdjacentElement('afterend', logoutLi);
    document.getElementById('ynpLogoutBtn').addEventListener('click', async (e) => {
      e.preventDefault();
      await window.ynpAuth.signOut();
      location.href = 'index.html';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();

  window.ynpAuth.onAuthStateChange(() => refresh());
})();

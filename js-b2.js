/* ═══════════════════════════════════════════════════════════════
   B2 리디자인 (2026-09-05) — 리빌 모션 + 스크롤 보정
   반드시 script.js 뒤에 로드할 것
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1) 섹션 헤더 수평 리빌 ──────────────────────────────────
     탭 패널(.tab-pane)은 display:none 이라 IntersectionObserver 가
     영영 관측하지 못한다. 숨은 요소는 무장하지 않고, 탭이 열린 뒤
     다시 스캔한다.                                              */
  if(!reduce && 'IntersectionObserver' in window){
    var SEL = '.sec-eyebrow,.sec-title,.sec-desc,.stats-eyebrow,.stats-title,.stats-subtitle';
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});

    var arm = function(){
      var list = document.querySelectorAll(SEL);
      Array.prototype.forEach.call(list, function(el, i){
        if(el.dataset.b2Done) return;
        // 이미 .rv 계열로 움직이는 요소는 제외 (부모와 이중 애니메이션 방지)
        if(el.closest('.rv,.rv-l,.rv-r')){ el.dataset.b2Done = '1'; return; }
        // 아직 숨어있음(탭 미개방) → 다음 기회에 다시 시도
        if(el.offsetParent === null) return;
        // 이미 스크롤이 지나간 위치면 무장하지 않는다.
        // opacity:0 을 걸어도 옵저버가 다시 못 잡아 영영 안 보이게 되는 것을 막는다.
        if(el.getBoundingClientRect().bottom < 0){ el.dataset.b2Done = '1'; return; }

        el.dataset.b2Done = '1';
        el.classList.add('b2-x');
        el.style.transitionDelay = ((i % 3) * 0.13) + 's';
        io.observe(el);

        var box = el.parentElement;
        if(el.classList.contains('sec-eyebrow') && box && !box.dataset.b2Vrule){
          box.dataset.b2Vrule = '1';
          box.classList.add('b2-vrule');
          io.observe(box);
        }
      });
    };

    arm();
    document.addEventListener('click', function(){ setTimeout(arm, 90); });
    window.addEventListener('hashchange', function(){ setTimeout(arm, 90); });
    // 해시로 진입해 탭이 늦게 열리는 경우 대비
    [300, 900].forEach(function(t){ setTimeout(arm, t); });
  }

  /* ── 2) 같은 페이지 nav 클릭 시 최상단 보정 ───────────────────
     script.js 는 '같은 페이지' 판정 시 기본 이동을 막고 탭만 바꾼다.
     이때 스크롤이 그대로 남아 새 탭이 중간부터 보인다.
     라이브(cleanUrls: /about)에서는 판정이 어긋나 실제 이동 →
     forceTop 이 걸리므로 증상이 없지만, 설정이 바뀌거나 .html 경로로
     접근하면 그대로 드러난다. 환경과 무관하게 방어한다.          */
  var norm = function(s){
    s = (s || '').toLowerCase().split('?')[0].replace(/\.html$/, '');
    return (s === '' || s === 'index') ? 'index' : s;
  };
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('#navbar a[href*="#"]');
    if(!a) return;
    var parts = (a.getAttribute('href') || '').split('#');
    if(!parts[1]) return;
    var here = norm(location.pathname.split('/').pop());
    if(norm(parts[0] || here) !== here) return;   // 다른 페이지면 브라우저에 맡긴다
    // 기본 이동이 막힌 경우(같은 문서 내 탭 전환)에만 의미가 있다
    setTimeout(function(){
      if(window.scrollY > 0){
        window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'});
      }
    }, 0);
  }, false);
})();

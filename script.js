// ═══════════════════════════════════════════════════════
// 글로벌: nav 메뉴 anchor 클릭 시 자동 스크롤 차단 (모든 페이지 공통)
// 같은 페이지 내 hash 변경만 발생, 페이지는 최상단(hero) 유지
// 각 페이지의 hashchange 핸들러가 패널/탭 전환 처리
// ═══════════════════════════════════════════════════════
(function(){
  if('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // nav anchor 클릭 가로채기
  document.addEventListener('click', (e) => {
    const a = e.target.closest('#navbar a[href*="#"]');
    if(!a) return;
    const href = a.getAttribute('href') || '';
    const [pathPart, hashPart] = href.split('#');
    if(!hashPart) return;
    const targetFile = (pathPart || currentFile).toLowerCase();
    // 같은 페이지 내에서만 가로챔
    if(targetFile === currentFile){
      e.preventDefault();
      if(location.hash !== '#'+hashPart){
        history.replaceState(null, '', '#'+hashPart);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }
  }, true);

  // 페이지 진입 시 hash가 있으면 강제 최상단 (다중 시점)
  if(location.hash){
    const forceTop = () => window.scrollTo(0, 0);
    forceTop();
    requestAnimationFrame(() => { forceTop(); requestAnimationFrame(forceTop); });
    setTimeout(forceTop, 50);
    setTimeout(forceTop, 150);
    setTimeout(forceTop, 350);
    window.addEventListener('load', forceTop, {once:true});
  }
})();

// Navbar — scroll 상태 (hide/show 는 sticky 자식들과 충돌하여 비활성화)
const navbar = document.getElementById('navbar');
const stbtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 50);
  if(stbtn) stbtn.classList.toggle('show', y > 400);
}, { passive: true });

// Hamburger
const hbg = document.getElementById('hbg');
const nl = document.getElementById('navLinks');
if(hbg && nl){
  hbg.addEventListener('click', () => { hbg.classList.toggle('on'); nl.classList.toggle('open'); });
  document.querySelectorAll('.has-sub > a').forEach(a => {
    a.addEventListener('click', e => { if(window.innerWidth<=768){ e.preventDefault(); a.parentElement.classList.toggle('open'); } });
  });
  document.querySelectorAll('.sub-nav a').forEach(a => {
    a.addEventListener('click', () => { nl.classList.remove('open'); hbg.classList.remove('on'); });
  });
}

// Reveal
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(!e.isIntersecting) return;
    const d = e.target.dataset.delay || 0;
    setTimeout(() => e.target.classList.add('on'), +d);
    ro.unobserve(e.target);
  });
}, {threshold:0.1, rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.rv,.rv-l,.rv-r').forEach(el => ro.observe(el));

// Counter
const co = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(!e.isIntersecting) return;
    const el = e.target, t = +el.dataset.target;
    let cur = 0; const step = t/(1400/16);
    const tm = setInterval(() => { cur+=step; if(cur>=t){el.textContent=t;clearInterval(tm);}else el.textContent=Math.floor(cur); }, 16);
    co.unobserve(el);
  });
}, {threshold:0.5});
document.querySelectorAll('[data-target]').forEach(el => co.observe(el));

// Inner tabs
function switchTab(grp, tabId) {
  const tab = grp.querySelector(`[data-tab="${tabId}"]`);
  const pane = grp.querySelector('#'+tabId);
  if (!tab || !pane) return;
  grp.querySelectorAll('.inner-tab').forEach(t => t.classList.remove('active'));
  grp.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  tab.classList.add('active');
  pane.classList.add('active');
  // Elements inside display:none panes are never seen by IntersectionObserver, so force them visible
  pane.querySelectorAll('.rv,.rv-l,.rv-r').forEach(el => el.classList.add('on'));
}
document.querySelectorAll('.inner-tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.closest('.tab-group'), tab.dataset.tab));
});
// URL 해시로 탭 자동 열기 (예: about.html#history, result.html#consulting)
function activateHashTab() {
  const hash = location.hash.replace('#','');
  if(!hash) return;
  document.querySelectorAll('.tab-group').forEach(grp => {
    if(grp.querySelector('#'+hash)) switchTab(grp, hash);
  });
}
activateHashTab();
window.addEventListener('hashchange', activateHashTab);

// Contact form — mailto 방식으로 실제 이메일 클라이언트 전송
const cf = document.getElementById('contactForm');
if(cf) cf.addEventListener('submit', e => {
  e.preventDefault();
  const get = name => {
    const el = cf.querySelector(`[name="${name}"]`);
    return el ? el.value.trim() : '';
  };
  const 이름 = get('이름');
  const 연락처 = get('연락처');
  const 이메일 = get('이메일');
  const 소속 = get('소속');
  const 문의유형 = get('문의유형');
  const 사업지 = get('사업지');
  const 문의내용 = get('문의내용');

  const agreeMarketing = document.getElementById('agreeMarketing');
  const 마케팅수신동의 = agreeMarketing && agreeMarketing.checked ? '동의' : '미동의';

  const subject = `[와이낫플래닝 홈페이지 문의] ${문의유형 || '문의'}`;
  const body = [
    `이름: ${이름}`,
    `연락처: ${연락처}`,
    `이메일: ${이메일}`,
    `소속/회사: ${소속}`,
    `문의유형: ${문의유형}`,
    `사업지: ${사업지}`,
    ``,
    `문의내용:`,
    `${문의내용}`,
    ``,
    `─ 동의 사항 ─`,
    `개인정보 수집·이용: 동의`,
    `마케팅·홍보 정보 수신: ${마케팅수신동의}`
  ].join('\n');

  window.location.href = `mailto:ynp073@ynp.uplusworks.co.kr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const b = cf.querySelector('.btn-submit');
  b.textContent = '이메일 앱이 열렸습니다 ✓';
  b.style.background = '#00A8A8';
  setTimeout(() => { b.textContent = '문의 보내기 →'; b.style.background = ''; cf.reset(); }, 4000);
});

// Scroll top
if(stbtn) stbtn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

// Hero spotlight follows cursor (index only)
(function(){
  const hero = document.getElementById('main-hero');
  const spotlight = hero ? hero.querySelector('.hero-spotlight') : null;
  if(!hero || !spotlight) return;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    const gx = Math.round((e.clientX - r.left) / r.width * 100);
    const gy = Math.round((e.clientY - r.top) / r.height * 100);
    spotlight.style.background = `radial-gradient(600px circle at ${gx}% ${gy}%, rgba(255,160,50,0.12) 0%, transparent 65%)`;
  });
  hero.addEventListener('mouseleave', () => { spotlight.style.background = ''; });
})();

// Window flicker
document.querySelectorAll('.win-warm').forEach(w => {
  setInterval(() => {
    w.style.opacity = Math.random()>.2 ? '1' : '0.15';
    w.style.transition = 'opacity .5s ease';
  }, 1500+Math.random()*3500);
});

// Result filter + load-more
(function(){
  const grid = document.getElementById('resultGrid');
  if (!grid) return;

  const BATCH = 12;
  const cards = Array.from(grid.querySelectorAll('.result-card'));
  let activeFilter = '전체';
  let shown = 0;

  function filtered() {
    return activeFilter === '전체'
      ? cards
      : cards.filter(c => c.dataset.type === activeFilter);
  }

  function render(reset) {
    if (reset) shown = 0;
    const pool = filtered();
    const next = pool.slice(shown, shown + BATCH);

    // Show new batch
    next.forEach((c, i) => {
      c.style.display = '';
      c.style.transform = 'translateY(20px)';
      c.style.opacity = '0';
      requestAnimationFrame(() => {
        setTimeout(() => {
          c.style.transition = 'opacity .4s ease, transform .4s ease';
          c.style.opacity = '1';
          c.style.transform = 'translateY(0)';
        }, i * 25);
      });
    });

    shown += next.length;

    // Update count
    const countEl = document.getElementById('resultCount');
    if (countEl) countEl.textContent = shown + ' / ' + pool.length + '건 표시 중';

    // Update load-more
    const wrap = document.getElementById('loadMoreWrap');
    const btn = document.getElementById('loadMoreBtn');
    const remain = document.getElementById('loadMoreRemain');
    const left = pool.length - shown;
    if (wrap) wrap.style.display = left > 0 ? '' : 'none';
    if (remain) remain.textContent = '(' + left + '건 남음)';
  }

  function resetGrid() {
    cards.forEach(c => {
      c.style.display = 'none';
      c.style.opacity = '0';
      c.style.transition = '';
    });
    render(true);
  }

  // Filter buttons
  document.querySelectorAll('.result-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.result-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      resetGrid();
    });
  });

  // Load more
  const loadBtn = document.getElementById('loadMoreBtn');
  if (loadBtn) loadBtn.addEventListener('click', () => render(false));

  // Init
  resetGrid();
})();

// Hero particles
(function(){
  const canvas = document.getElementById('hero-particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W,H,pts=[];
  const mx={x:-9999,y:-9999};
  function resize(){ W=canvas.width=canvas.offsetWidth; H=canvas.height=canvas.offsetHeight; }
  window.addEventListener('resize', resize); resize();
  const hero = document.getElementById('main-hero');
  if(hero) hero.addEventListener('mousemove', e=>{
    const r=canvas.getBoundingClientRect(); mx.x=e.clientX-r.left; mx.y=e.clientY-r.top;
  });
  function P(){ this.reset(); }
  P.prototype.reset=function(){
    this.x=Math.random()*W; this.y=Math.random()*H;
    this.vx=(Math.random()-.5)*.3; this.vy=(Math.random()-.5)*.3;
    this.r=Math.random()*1.4+.3;
    const cols=['rgba(0,168,168,','rgba(140,190,220,','rgba(60,200,200,'];
    this.c=cols[Math.floor(Math.random()*cols.length)]+(Math.random()*.4+.1)+')';
    this.life=Math.random()*350+200; this.age=0;
  };
  P.prototype.step=function(){
    const dx=mx.x-this.x,dy=mx.y-this.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<120){this.vx-=(dx/d)*.03;this.vy-=(dy/d)*.03;}
    this.x+=this.vx; this.y+=this.vy; this.vx*=.993; this.vy*=.993; this.age++;
    if(this.x<0||this.x>W||this.y<0||this.y>H||this.age>this.life) this.reset();
  };
  P.prototype.draw=function(){ ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle=this.c;ctx.fill(); };
  const N=Math.min(80,Math.floor(W*H/12000));
  for(let i=0;i<N;i++) pts.push(new P());
  function loop(){
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{p.step();p.draw();});
    // connections
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<90){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(0,168,168,${(1-d/90)*.07})`;ctx.lineWidth=.5;ctx.stroke();}
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

// ═══════════════════════════════════════════════════════
// 디벨롭 1단계: 스크롤 진행률 바
// ═══════════════════════════════════════════════════════
(function(){
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  const fill = document.createElement('div');
  fill.className = 'scroll-progress-fill';
  bar.appendChild(fill);
  document.body.insertBefore(bar, document.body.firstChild);

  let raf = null;
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    fill.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    raf = null;
  };
  const onScroll = () => { if (raf === null) raf = requestAnimationFrame(update); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// ═══════════════════════════════════════════════════════
// 디벨롭 1단계: 숫자 카운터 애니메이션 (.stat-number)
// ═══════════════════════════════════════════════════════
(function(){
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;
  const animate = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      el.textContent = Math.floor(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => io.observe(c));
})();

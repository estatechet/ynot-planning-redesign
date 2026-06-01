// ============================================================
// 관리자 콘솔 숨김 트리거
// 로고를 1.5초 이내 5회 연속 클릭하면 인증 모달이 뜨고,
// 관리자 계정 입력에 성공하면 /manage 로 이동한다.
// ============================================================
(function(){
  const KEY = 'ynp_lc';
  const WINDOW_MS = 1500;
  const NEED = 5;

  function getRecent(){
    try {
      const stamps = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      return stamps.filter(t => Date.now() - t < WINDOW_MS);
    } catch { return []; }
  }
  function setRecent(arr){ sessionStorage.setItem(KEY, JSON.stringify(arr)); }
  function clearStamps(){ sessionStorage.removeItem(KEY); }

  function init(){
    // 페이지 로드 시 누적된 클릭이 임계 도달 상태면 즉시 모달
    const recent = getRecent();
    if (recent.length >= NEED) { clearStamps(); openAdminGate(); return; }
    setRecent(recent); // 만료된 항목 정리

    document.querySelectorAll('.nav-logo').forEach(el => {
      el.addEventListener('click', (e) => {
        const list = getRecent();
        list.push(Date.now());
        if (list.length >= NEED) {
          e.preventDefault();
          clearStamps();
          openAdminGate();
        } else {
          setRecent(list);
          // 일반 클릭은 그대로 이동
        }
      });
    });
  }

  // ── Supabase 라이브러리/클라이언트 지연 로드 ─────────────────
  function loadScript(src){
    return new Promise((resolve, reject) => {
      const norm = src.split('?')[0];
      const already = Array.from(document.scripts).some(s => s.src && s.src.indexOf(norm) !== -1);
      if (already) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('스크립트 로드 실패: ' + src));
      document.head.appendChild(s);
    });
  }
  async function ensureSupabase(){
    if (window.ynpAuth) return;
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    await loadScript('js/supabase-config.js?v=8');
    await loadScript('js/supabase-client.js?v=8');
    if (!window.ynpAuth) throw new Error('인증 모듈 초기화 실패');
  }

  // ── 모달 ─────────────────────────────────────────────────
  async function openAdminGate(){
    if (document.getElementById('ynp-admin-gate')) return;

    // 모달 먼저 띄우고 인증 모듈은 백그라운드로 로드
    const wrap = document.createElement('div');
    wrap.id = 'ynp-admin-gate';
    wrap.innerHTML = `
      <style>
        #ynp-admin-gate{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Noto Sans KR',sans-serif;animation:ynp-fade .15s ease-out}
        @keyframes ynp-fade{from{opacity:0}to{opacity:1}}
        #ynp-admin-gate .ynp-box{background:#fff;border-radius:8px;padding:28px 26px 22px;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)}
        #ynp-admin-gate h3{margin:0 0 6px;font-size:1.1rem;color:#1a1a1a;font-weight:800}
        #ynp-admin-gate .sub{font-size:.78rem;color:#666;margin:0 0 18px}
        #ynp-admin-gate label{display:block;font-size:.74rem;font-weight:700;margin-bottom:5px;color:#1a1a1a;letter-spacing:.04em}
        #ynp-admin-gate input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e0e0e0;border-radius:6px;font:inherit;font-size:.88rem;background:#fff;outline:none;margin-bottom:12px;transition:border-color .15s,box-shadow .15s}
        #ynp-admin-gate input:focus{border-color:#0F4B96;box-shadow:0 0 0 3px rgba(15,75,150,.08)}
        #ynp-admin-gate .ynp-msg{display:none;padding:8px 12px;border-radius:5px;font-size:.78rem;margin-bottom:10px;line-height:1.4}
        #ynp-admin-gate .ynp-msg.show{display:block}
        #ynp-admin-gate .ynp-msg.error{background:#fdecec;color:#c0392b;border:1px solid #f5c6c6}
        #ynp-admin-gate .ynp-msg.info{background:#eff5fb;color:#0a356b;border:1px solid #c8def0}
        #ynp-admin-gate .ynp-row{display:flex;gap:8px;margin-top:6px}
        #ynp-admin-gate button{flex:1;padding:10px;border:none;border-radius:6px;font:inherit;font-weight:700;font-size:.85rem;cursor:pointer;transition:background .15s,opacity .15s}
        #ynp-admin-gate .ynp-go{background:#0F4B96;color:#fff}
        #ynp-admin-gate .ynp-go:hover:not(:disabled){background:#0a356b}
        #ynp-admin-gate button:disabled{opacity:.5;cursor:not-allowed}
        #ynp-admin-gate .ynp-cancel{background:#f5f5f5;color:#666;border:1px solid #e0e0e0!important}
        #ynp-admin-gate .ynp-cancel:hover{background:#e8e8e8}
      </style>
      <div class="ynp-box" role="dialog" aria-modal="true" aria-labelledby="ynp-admin-title">
        <h3 id="ynp-admin-title">관리자 인증</h3>
        <p class="sub">관리자 계정으로 로그인하세요.</p>
        <form id="ynp-admin-form" autocomplete="on">
          <div id="ynp-admin-msg" class="ynp-msg"></div>
          <label for="ynp-admin-id">아이디</label>
          <input id="ynp-admin-id" type="text" required autocapitalize="off" autocomplete="username">
          <label for="ynp-admin-pw">비밀번호</label>
          <input id="ynp-admin-pw" type="password" required autocomplete="current-password">
          <div class="ynp-row">
            <button type="button" class="ynp-cancel" id="ynp-admin-cancel">취소</button>
            <button type="submit" class="ynp-go" id="ynp-admin-go">접속</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(wrap);

    const msg = document.getElementById('ynp-admin-msg');
    const idEl = document.getElementById('ynp-admin-id');
    const pwEl = document.getElementById('ynp-admin-pw');
    const goBtn = document.getElementById('ynp-admin-go');
    function showMsg(kind, text){ msg.className = 'ynp-msg show ' + kind; msg.textContent = text; }
    function clearMsg(){ msg.className = 'ynp-msg'; msg.textContent = ''; }
    function close(){ wrap.remove(); }

    document.getElementById('ynp-admin-cancel').addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    document.addEventListener('keydown', function escClose(e){
      if (e.key === 'Escape' && document.getElementById('ynp-admin-gate')) {
        close(); document.removeEventListener('keydown', escClose);
      }
    });
    setTimeout(() => idEl.focus(), 50);

    // Supabase 모듈 백그라운드 로드
    let supaReady = false;
    ensureSupabase().then(() => { supaReady = true; })
      .catch(err => { showMsg('error', err.message); goBtn.disabled = true; });

    document.getElementById('ynp-admin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMsg();
      const username = idEl.value.trim().toLowerCase();
      const password = pwEl.value;
      if (!username || !password) return;

      goBtn.disabled = true; goBtn.textContent = '확인 중…';

      if (!supaReady) {
        try { await ensureSupabase(); supaReady = true; }
        catch (err) { showMsg('error', err.message); goBtn.disabled = false; goBtn.textContent = '접속'; return; }
      }

      const { error } = await window.ynpAuth.signIn({ username, password });
      if (error) {
        showMsg('error', '아이디 또는 비밀번호가 올바르지 않습니다.');
        goBtn.disabled = false; goBtn.textContent = '접속';
        return;
      }
      const profile = await window.ynpAuth.getProfile();
      if (!profile || profile.role !== 'admin') {
        await window.ynpAuth.signOut();
        showMsg('error', '관리자 권한이 없습니다.');
        goBtn.disabled = false; goBtn.textContent = '접속';
        return;
      }
      showMsg('info', '인증 성공. 관리자 페이지로 이동합니다…');
      setTimeout(() => { location.href = 'manage/'; }, 400);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

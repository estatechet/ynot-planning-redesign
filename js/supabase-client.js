// ============================================================
// 공통 Supabase 클라이언트
// 페이지에서 사용:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="js/supabase-config.js"></script>
//   <script src="js/supabase-client.js"></script>
//   → window.ynpClient, window.ynpAuth, window.ynpDB 사용
// ============================================================
(function(){
  if (!window.supabase || !window.YNP_SUPABASE) {
    console.error('[YNP] supabase-js 또는 supabase-config.js 가 로드되지 않았습니다.');
    return;
  }

  const client = window.supabase.createClient(
    window.YNP_SUPABASE.url,
    window.YNP_SUPABASE.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  window.ynpClient = client;

  // ── 인증 헬퍼 (아이디 기반 — 내부적으로 username@ynp.kr 가짜 이메일 사용)
  // ※ Supabase 가 .local 같은 reserved TLD 를 거부하므로 실제 TLD 사용
  const USERNAME_DOMAIN = '@ynp.kr';
  const toEmail = u => String(u || '').trim().toLowerCase() + USERNAME_DOMAIN;

  // ── 인증 헬퍼: 관리자 콘솔(/manage)에서만 사용. 공개 회원가입 UI는 없음.
  window.ynpAuth = {
    async signIn({ username, password }) {
      return client.auth.signInWithPassword({ email: toEmail(username), password });
    },
    async signOut() {
      return client.auth.signOut();
    },
    async getUser() {
      const { data } = await client.auth.getUser();
      return data.user || null;
    },
    async getProfile() {
      const user = await this.getUser();
      if (!user) return null;
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) { console.warn('[YNP] profile fetch', error); return null; }
      return data;
    }
  };

  // ── DB 헬퍼 (자주 쓰는 쿼리)
  window.ynpDB = {
    // 보도자료
    async listPress({ search = '', page = 1, perPage = 20 } = {}) {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      let q = client.from('press_releases')
        .select('*', { count: 'exact' })
        .eq('is_pinned', false)
        .order('published_at', { ascending: false })
        .range(from, to);
      if (search) q = q.ilike('title', `%${search}%`);
      return q;
    },
    async listPinnedPress() {
      return client.from('press_releases')
        .select('*')
        .eq('is_pinned', true)
        .order('published_at', { ascending: false });
    },
    async listPressAdmin({ search = '', page = 1, perPage = 20 } = {}) {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      let q = client.from('press_releases')
        .select('*', { count: 'exact' })
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .range(from, to);
      if (search) q = q.ilike('title', `%${search}%`);
      return q;
    },
    async getPress(id) {
      return client.from('press_releases').select('*').eq('id', id).single();
    },
    async createPress(row) {
      return client.from('press_releases').insert(row).select().single();
    },
    async updatePress(id, patch) {
      return client.from('press_releases').update(patch).eq('id', id).select().single();
    },
    async deletePress(id) {
      return client.from('press_releases').delete().eq('id', id);
    },

    // 분양실적
    async listSales({ type } = {}) {
      let q = client.from('sales_results')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: false })
        .order('id', { ascending: false });
      if (type && type !== '전체') q = q.eq('type', type);
      return q;
    },
    async listSalesAdmin() {
      return client.from('sales_results').select('*')
        .order('display_order', { ascending: false }).order('id', { ascending: false });
    },
    async createSales(row) {
      return client.from('sales_results').insert(row).select().single();
    },
    async updateSales(id, patch) {
      return client.from('sales_results').update(patch).eq('id', id).select().single();
    },
    async deleteSales(id) {
      return client.from('sales_results').delete().eq('id', id);
    },

    // 컨설팅실적
    async listConsulting() {
      return client.from('consulting_results').select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: false }).order('id', { ascending: false });
    },
    async listConsultingAdmin() {
      return client.from('consulting_results').select('*')
        .order('display_order', { ascending: false }).order('id', { ascending: false });
    },
    async createConsulting(row) {
      return client.from('consulting_results').insert(row).select().single();
    },
    async updateConsulting(id, patch) {
      return client.from('consulting_results').update(patch).eq('id', id).select().single();
    },
    async deleteConsulting(id) {
      return client.from('consulting_results').delete().eq('id', id);
    }
  };

  // ── Storage 헬퍼
  window.ynpStorage = {
    getPublicUrl(bucket, path) {
      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    async upload(bucket, path, file) {
      return client.storage.from(bucket).upload(path, file, {
        cacheControl: '3600', upsert: true
      });
    },
    async remove(bucket, paths) {
      return client.storage.from(bucket).remove(Array.isArray(paths) ? paths : [paths]);
    }
  };
})();

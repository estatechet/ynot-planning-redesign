// ============================================================
// 발주처 client 이름 → 로고 파일 매핑
// - 한 회사의 여러 표기를 같은 파일로 정규화
// - result.html 의 컨설팅 카드 렌더링에서 client 필드를 split → 각 조각을 normalize → lookup
// - 없으면 null 반환, 호출자는 그라디언트로 폴백
// ============================================================
(function(){
  // canonical 키 → 로고 파일 경로
  const LOGOS = {
    'hyundai-ec':  'img/logos/hyundai-ec.svg',
    'dl-enc':      'img/logos/dl-enc.svg',
    'ktng':        'img/logos/ktng.svg',
    'posco':       'img/logos/posco.svg',
    'shinsegae':   'img/logos/shinsegae.svg',
    'kt':          'img/logos/kt.svg',
  };

  // 별칭 → canonical 키
  const ALIASES = {
    // 현대건설
    '현대건설': 'hyundai-ec',
    '현대건설(주)': 'hyundai-ec',
    '현대건설㈜': 'hyundai-ec',

    // DL이앤씨 (구 대림산업)
    'DL E&C': 'dl-enc',
    'DL이앤씨': 'dl-enc',
    '디엘이앤씨': 'dl-enc',
    '대림산업': 'dl-enc',
    '대림': 'dl-enc',
    '대림이앤씨': 'dl-enc',
    '㈜대림': 'dl-enc',
    'DL E&CDL E&C': 'dl-enc',
    'DL건설': 'dl-enc',
    '디엘건설': 'dl-enc',
    '대림건설': 'dl-enc',

    // KT&G
    'KT&G': 'ktng',
    'KT&G 시행': 'ktng',

    // POSCO 그룹 (포스코이앤씨·포스코건설 동일 브랜드)
    'POSCO': 'posco',
    '포스코': 'posco',
    '포스코이앤씨': 'posco',
    '포스코건설': 'posco',
    '포스코 E&C': 'posco',

    // 신세계 (신세계건설 동일 브랜드)
    '신세계': 'shinsegae',
    '신세계건설': 'shinsegae',
    '(주)신세계 건설': 'shinsegae',
    '신세계 건설': 'shinsegae',

    // KT 그룹 (KT에스테이트는 KT 자회사)
    'KT': 'kt',
    'KT에스테이트': 'kt',
    'KT 에스테이트': 'kt',
  };

  function normalize(name){
    if (!name) return '';
    return String(name)
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^\(주\)\s*/, '')
      .replace(/^㈜\s*/, '')
      .replace(/\s*\(주\)$/, '')
      .replace(/\s*㈜$/, '')
      .trim();
  }

  // client 필드 → 로고 경로 배열 (1개 이상이면 합작)
  function getLogos(clientField){
    if (!clientField) return [];
    const parts = String(clientField)
      .split(/[\/,·∙、]/)
      .map(s => normalize(s))
      .filter(Boolean);
    const result = [];
    for (const p of parts) {
      const key = ALIASES[p];
      if (key && LOGOS[key]) {
        result.push({ key, path: LOGOS[key], alias: p });
      }
    }
    return result;
  }

  window.CLIENT_LOGOS = { LOGOS, ALIASES, normalize, getLogos };
})();

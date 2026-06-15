// ============================================================
// 발주처 client 이름 → 로고 파일 매핑
// - 한 회사의 여러 표기를 같은 파일로 정규화
// - result.html 의 컨설팅 카드 렌더링에서 client 필드를 split → 각 조각을 normalize → lookup
// - 없으면 null 반환, 호출자는 그라디언트로 폴백
// ============================================================
(function(){
  // canonical 키 → 로고 파일 경로
  const LOGOS = {
    'hyundai-ec':    'img/logos/hyundai-ec.svg',
    'dl-enc':        'img/logos/dl-enc.svg',
    'ktng':          'img/logos/ktng.svg',
    'posco':         'img/logos/posco.svg',
    'shinsegae':     'img/logos/shinsegae.svg',
    'kt':            'img/logos/kt.svg',
    'lotte-ec':      'img/logos/lotte-ec.svg',
    'hdc':           'img/logos/hdc.svg',
    'gs-ec':         'img/logos/gs-ec.svg',
    'meritz':        'img/logos/meritz.svg',
    'hyosung':       'img/logos/hyosung.svg',
    'hyundai-grp':   'img/logos/hyundai-grp.svg',
    'hanwha-grp':    'img/logos/hanwha-grp.svg',
    'sk-grp':        'img/logos/sk-grp.svg',
    'lotte-grp':     'img/logos/lotte-grp.svg',
    'hyundai-motor': 'img/logos/hyundai-motor.svg',
    'kia':           'img/logos/kia.svg',
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

    // POSCO (포스코이앤씨·포스코건설)
    'POSCO': 'posco',
    '포스코': 'posco',
    '포스코이앤씨': 'posco',
    '포스코건설': 'posco',
    '포스코 E&C': 'posco',

    // 신세계 (신세계건설)
    '신세계': 'shinsegae',
    '신세계건설': 'shinsegae',
    '(주)신세계 건설': 'shinsegae',
    '신세계 건설': 'shinsegae',

    // KT 그룹
    'KT': 'kt',
    'KT에스테이트': 'kt',
    'KT 에스테이트': 'kt',

    // 롯데건설 (서브 로고)
    '롯데건설': 'lotte-ec',

    // 롯데 그룹 generic
    '롯데': 'lotte-grp',
    '롯데그룹': 'lotte-grp',
    '롯데정보통신': 'lotte-grp',

    // HDC (현대산업개발·아이앤콘스 통합)
    'HDC': 'hdc',
    'HDC그룹': 'hdc',
    'HDC현대산업개발': 'hdc',
    'HDC 현대산업개발': 'hdc',
    '현대산업개발': 'hdc',
    'HDC 아이앤콘스': 'hdc',
    'HDC아이앤콘스': 'hdc',
    'HDC 아이콘스': 'hdc',
    'HDC아이콘스': 'hdc',
    '아이앤콘스': 'hdc',
    '현대아이앤콘스': 'hdc',

    // GS건설
    'GS': 'gs-ec',
    'GS건설': 'gs-ec',
    '지에스건설': 'gs-ec',
    'GS Engineering & Construction': 'gs-ec',

    // 메리츠 (증권·종금)
    '메리츠': 'meritz',
    '메리츠종금': 'meritz',
    '메리츠증권': 'meritz',
    '메리츠금융지주': 'meritz',

    // 효성
    '효성': 'hyosung',
    '효성중공업': 'hyosung',
    '(주)효성': 'hyosung',
    '㈜효성': 'hyosung',

    // 한화 그룹
    '한화': 'hanwha-grp',
    '한화그룹': 'hanwha-grp',
    '한화건설': 'hanwha-grp',
    '한화 건설부문': 'hanwha-grp',
    '한화증권': 'hanwha-grp',
    '한화H&R': 'hanwha-grp',

    // SK 그룹 (자회사들도 모기업 로고로 통일)
    'SK': 'sk-grp',
    'SK그룹': 'sk-grp',
    'SK C&C': 'sk-grp',
    'SK C&D': 'sk-grp',
    'SK D&D': 'sk-grp',
    'SK E&C': 'sk-grp',
    'SK건설': 'sk-grp',
    'sk건설': 'sk-grp',
    'SK에코플랜트': 'sk-grp',

    // 현대 그룹 (현대 단독 표기)
    '현대': 'hyundai-grp',
    '현대그룹': 'hyundai-grp',
    '현대엔지니어링': 'hyundai-grp',

    // 현대자동차 (별도)
    '현대자동차': 'hyundai-motor',
    '대주단 현대자동차증권': 'hyundai-motor',

    // 기아
    '기아': 'kia',
    '기아자동차': 'kia',
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

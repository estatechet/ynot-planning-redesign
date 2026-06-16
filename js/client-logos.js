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
    'doosan':        'img/logos/doosan.svg',
    'ssangyong':     'img/logos/ssangyong.svg',
    'lg-grp':        'img/logos/lg-grp.svg',
    'kumho':         'img/logos/kumho.svg',
    'kb':            'img/logos/kb.svg',
    'cj':            'img/logos/cj.svg',
    'woori':         'img/logos/woori.svg',
    'shinhan':       'img/logos/shinhan.svg',
    'nh-inv':        'img/logos/nh-inv.svg',
    'hd-hyundai':    'img/logos/hd-hyundai.svg',
    'samsung':       'img/logos/samsung.svg',
    'dongbu':        'img/logos/dongbu.svg',
    // Round 5 — 공식 CI 페이지에서 직접 수집
    'seohee':        'img/logos/seohee.jpg',
    'daebang':       'img/logos/daebang.png',
    'kcc':           'img/logos/kcc.png',
    'xi-snd':        'img/logos/xi-snd.png',
    'hanshin':       'img/logos/hanshin.jpg',
    'woomi':         'img/logos/woomi.jpg',
    'hoban':         'img/logos/hoban.png',
    'hwasung':       'img/logos/hwasung.svg',
    'kolon-global':  'img/logos/kolon-global.svg',
    'sgc':           'img/logos/sgc.png',
    'daewoo-ec':     'img/logos/daewoo-ec.jpg',
    'prugio':        'img/logos/prugio.png',
    'woori-trust':   'img/logos/woori-trust.jpg',
    'shinyoung':     'img/logos/shinyoung.svg',
    'the-sharp':     'img/logos/the-sharp.svg',
    'raemian':       'img/logos/raemian.png',
    'samsung-cnt':   'img/logos/samsung-cnt.svg',
    // Round 6 추가
    'mugunghwa':     'img/logos/mugunghwa.png',
    'im-sec':        'img/logos/im-sec.png',
    'koramco':       'img/logos/koramco.svg',
    'isu':           'img/logos/isu.jpg',
    'kukdong':       'img/logos/kukdong.jpg',
    // Round 7 — 사용자 제공 소스
    'hansung':       'img/logos/hansung.png',
    'jeepyoung':     'img/logos/jeepyoung.png',
    'dongdo':        'img/logos/dongdo.jpg',
    'upyung':        'img/logos/upyung.png',
    // Round 8 — 1·2순위 미커버 추가
    'samho':         'img/logos/samho.png',
    'hanyang-ec':    'img/logos/hanyang-ec.png',
    'chinhung':      'img/logos/chinhung.png',
    'bando':         'img/logos/bando.png',
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
    // 현대엔지니어링·㈜는 현대건설 로고로 통일 (계열사 통일 브랜드 표기)
    '현대엔지니어링': 'hyundai-ec',
    '현대엔지니어링㈜': 'hyundai-ec',
    '현대엔지니어링(주)': 'hyundai-ec',

    // 현대자동차 (별도)
    '현대자동차': 'hyundai-motor',
    '대주단 현대자동차증권': 'hyundai-motor',

    // 기아
    '기아': 'kia',
    '기아자동차': 'kia',

    // 두산
    '두산': 'doosan',
    '두산그룹': 'doosan',
    '두산건설': 'doosan',
    '두산건설(주)': 'doosan',

    // 쌍용
    '쌍용': 'ssangyong',
    '쌍용그룹': 'ssangyong',
    '쌍용건설': 'ssangyong',

    // LG 그룹
    'LG': 'lg-grp',
    'LG그룹': 'lg-grp',
    'LG전자': 'lg-grp',
    'LG유플러스': 'lg-grp',
    'LG화학': 'lg-grp',

    // 금호
    '금호': 'kumho',
    '금호그룹': 'kumho',
    '금호아시아나': 'kumho',
    '금호건설': 'kumho',
    '금호산업': 'kumho',

    // KB 금융
    'KB': 'kb',
    'KB금융': 'kb',
    'KB금융지주': 'kb',
    'KB증권': 'kb',
    '국민은행': 'kb',
    'KB국민은행': 'kb',
    '케이비부동산자산신탁 주식회사': 'kb',
    '케이비부동산자산신탁': 'kb',

    // CJ
    'CJ': 'cj',
    'CJ그룹': 'cj',
    'CJ제일제당': 'cj',

    // 우리 금융
    '우리금융': 'woori',
    '우리금융지주': 'woori',
    '우리은행': 'woori',
    '우리자산신탁': 'woori',

    // 신한 금융
    '신한': 'shinhan',
    '(주)신한': 'shinhan',
    '신한은행': 'shinhan',
    '신한금융': 'shinhan',
    '신한금융지주': 'shinhan',

    // NH 투자증권
    'NH투자증권': 'nh-inv',
    'NH증권': 'nh-inv',
    'NH': 'nh-inv',
    'NH농협': 'nh-inv',

    // HD현대 (현대중공업그룹)
    'HD현대': 'hd-hyundai',
    '현대중공업': 'hd-hyundai',
    'HD현대중공업': 'hd-hyundai',

    // 삼성
    '삼성': 'samsung',
    '삼성그룹': 'samsung',
    '삼성물산': 'samsung',
    '삼성전자': 'samsung',
    '삼성생명': 'samsung',

    // 동부건설 (현 DB Hitek 그룹)
    '동부': 'dongbu',
    '동부건설': 'dongbu',
    '동부그룹': 'dongbu',

    // Round 5 — 공식 CI 페이지 직접 수집 신규 매핑 (기존 매핑 영향 없음)
    // 서희건설
    '서희건설': 'seohee',
    '(주)서희건설': 'seohee',
    '서희': 'seohee',
    '서희스타힐스': 'seohee',

    // 대방 패밀리
    '대방건설': 'daebang',
    '대방건설(주)': 'daebang',
    '대방산업개발': 'daebang',
    '대방산업개발(주)': 'daebang',
    '대방이엔씨(주)': 'daebang',
    '대방주택(주)': 'daebang',
    '대방': 'daebang',

    // KCC건설
    'KCC건설': 'kcc',
    'KCC': 'kcc',

    // 자이에스앤디
    '자이에스앤디': 'xi-snd',
    '자이S&D': 'xi-snd',

    // 한신공영
    '한신공영': 'hanshin',

    // 우미건설
    '우미건설': 'woomi',
    '우미건설(주)': 'woomi',
    '(주)우미건설': 'woomi',
    '우미': 'woomi',

    // 호반건설
    '호반건설': 'hoban',
    '호반': 'hoban',
    '호반그룹': 'hoban',

    // 화성산업 (HS화성)
    '화성산업': 'hwasung',
    'HS화성': 'hwasung',

    // 코오롱글로벌
    '코오롱글로벌': 'kolon-global',
    '코오롱글로벌(주)': 'kolon-global',
    '(주)코오롱글로벌': 'kolon-global',
    '코오롱건설': 'kolon-global',
    '코오롱': 'kolon-global',

    // SGC E&C (구 SGC이테크건설/이테크건설)
    'SGC이테크건설': 'sgc',
    'SGC E&C': 'sgc',
    'SGC이앤씨': 'sgc',
    '이테크건설': 'sgc',

    // 대우건설
    '대우건설': 'daewoo-ec',
    '(주)대우건설': 'daewoo-ec',

    // 신영 패밀리
    '신영건설': 'shinyoung',
    '신영건설(주)': 'shinyoung',
    '신영D&C': 'shinyoung',
    '신영씨앤디': 'shinyoung',
    '신영그룹': 'shinyoung',
    '신영': 'shinyoung',

    // 우리자산신탁 (구체 자회사 로고가 더 정확 — 우리은행 generic 대체)
    '우리자산신탁': 'woori-trust',

    // 삼성물산 (구체 자회사 로고 — Samsung Electronics 워드마크 대체)
    '삼성물산': 'samsung-cnt',

    // Round 6 추가
    // 무궁화신탁
    '무궁화신탁': 'mugunghwa',
    '무궁화': 'mugunghwa',
    '무궁화홀딩스': 'mugunghwa',
    // iM증권 (구 하이투자증권)
    '하이투자증권': 'im-sec',
    'iM증권': 'im-sec',
    'iM 증권': 'im-sec',
    // 코람코자산신탁
    '코람코자산신탁': 'koramco',
    '코람코': 'koramco',
    '코람코자산운용': 'koramco',
    '(주)코람코자산신탁': 'koramco',
    // 아시아신탁 → 2022년 신한자산신탁으로 변경 (shinhan 매핑 재사용)
    '아시아신탁': 'shinhan',
    '신한자산신탁': 'shinhan',

    // Round 7 — 이수·극동 추가
    '이수건설': 'isu',
    '이수건설(주)': 'isu',
    '이수건설㈜': 'isu',
    '이수그룹': 'isu',
    '극동건설': 'kukdong',
    '극동': 'kukdong',
    '극동건설(주)': 'kukdong',

    // 한성건설
    '한성건설': 'hansung',
    '한성건설(주)': 'hansung',
    '한성건설㈜': 'hansung',
    // 지평건설 (브랜드: The Well)
    '지평건설': 'jeepyoung',
    '지평': 'jeepyoung',
    // 동도건설
    '동도건설': 'dongdo',
    '동도': 'dongdo',
    // 우평건설
    '우평건설': 'upyung',
    '우평건설(주)': 'upyung',
    '우평': 'upyung',

    // Round 8 — 1·2순위 매핑 추가
    // 삼호 (대우건설 자회사)
    '삼호': 'samho',
    '(주)삼호': 'samho',
    '㈜삼호': 'samho',
    // 한양건설 (BS한양)
    '한양건설': 'hanyang-ec',
    '(주)한양': 'hanyang-ec',
    '㈜한양': 'hanyang-ec',
    '한양': 'hanyang-ec',
    'BS한양': 'hanyang-ec',
    // 진흥기업
    '진흥기업': 'chinhung',
    '진흥건설': 'chinhung',
    // 반도건설
    '반도건설': 'bando',
    '반도건설 시공': 'bando',
    '반도유보라': 'bando',
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

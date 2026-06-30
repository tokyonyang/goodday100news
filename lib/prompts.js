import { kstDateLabel, effectiveNewsLookbackHours } from "./config.js";

function baseRules(extra = "") {
  return `
공통 기준:
- 기본 지역은 한국, 기본 시간대는 한국시간이다.
- 근거 기사는 최근 ${effectiveNewsLookbackHours()}시간 이내 기사와 제공된 날씨 정보만 사용한다.
- 제공된 뉴스 후보에 없는 수치, 환율, 주가, 날짜, 정책 발표는 절대 지어내지 않는다.
- 발행시각이 없거나 오래된 기사로 보이는 내용은 단정하지 않는다.
- 한국어 인물명은 동명이인이 많으므로 직함·소속·사건명이 확인되지 않으면 단정하지 않는다.
- 신문 기사 URL 전체는 절대 본문에 쓰지 않는다. 링크 버튼은 시스템이 따로 생성한다.
${extra || ""}
`.trim();
}

export function buildMorningBriefingPrompt(sourceText) {
  const dateLabel = kstDateLabel();

  return `
오늘 날짜: ${dateLabel}

아래 뉴스 후보와 날씨 정보를 바탕으로 한국어 모닝 브리핑을 작성해줘.

${baseRules("- 같은 이슈가 여러 기사에 반복되면 하나로 묶는다.\n- 뉴스 후보 전체에서 오늘 많이 언급되거나 시장 영향이 큰 핫이슈 키워드 5개를 먼저 뽑는다.\n- 투자 조언처럼 단정하지 말고 체크할 변수 중심으로 쓴다.\n- 텔레그램으로 보낼 것이므로 전체를 3,800자 안팎으로 압축한다.")}

반드시 아래 형식을 지켜줘:

🌅 ${dateLabel} 모닝 브리핑

좋은 아침입니다! 오늘 꼭 알아두면 좋을 주요 이슈를 5분 안에 정리해 드립니다.

🌤️ 오늘의 날씨
- 기준지역: ...
- 오늘 체크: ...

🔥 오늘의 핫이슈 키워드
#키워드1 - 선정 이유
#키워드2 - 선정 이유
#키워드3 - 선정 이유
#키워드4 - 선정 이유
#키워드5 - 선정 이유

🇰🇷 국내 주요 뉴스
① ...
② ...
③ ...

📈 경제 & 증시
...

🌎 국제 뉴스
...

💹 투자 포인트
✅ ...
✅ ...
✅ ...

🌤️ 오늘 한 줄 요약
"..."

🔗 참고한 주요 기사
- 기사 제목

뉴스 후보:
${sourceText}
`.trim();
}

export function buildKeywordBriefingPrompt(keyword, sourceText, personWarning = "") {
  return `
오늘 날짜: ${kstDateLabel()}
사용자 질문 또는 키워드: ${keyword}

아래 뉴스 후보를 바탕으로 텔레그램 답장을 작성해줘.

${baseRules("- 사용자가 묻는 키워드와 직접 관련 있는 내용만 우선한다.\n- 단순 요약이 아니라 왜 중요한지, 무엇을 더 봐야 하는지까지 정리한다.\n- 투자 권유나 매수/매도 판단처럼 쓰지 않는다.\n- 텔레그램 답장이므로 3,500자 안팎으로 압축한다.")}
${personWarning ? `\n인물 키워드 주의:\n${personWarning}\n` : ""}

반드시 아래 형식을 지켜줘:

🔎 키워드 딥브리핑: ${keyword}

한 줄 결론:
...

핵심 내용
① ...
② ...
③ ...

왜 중요한가
...

체크 포인트
✅ ...
✅ ...
✅ ...

관련 리스크
- ...
- ...

참고 기사
- 기사 제목

뉴스 후보:
${sourceText}
`.trim();
}

export function buildTrendRankingPrompt(sourceText) {
  return `
오늘 날짜: ${kstDateLabel()}

아래 뉴스 후보를 바탕으로 "뉴스 기반 급상승 이슈 TOP 10"을 작성해줘.

${baseRules("- 이것은 포털 공식 실시간 검색어 순위가 아니다.\n- 최근 뉴스 발행 빈도, 여러 섹션 반복 등장, 사회/경제 영향도, 시장 관심도를 근거로 순위를 추정한다.\n- 확인되지 않은 검색량이나 공식 순위는 지어내지 않는다.\n- 텔레그램으로 보낼 것이므로 3,500자 안팎으로 압축한다.")}

반드시 아래 형식을 지켜줘:

🔥 지금 뜨는 이슈 TOP 10
기준: 최근 뉴스 빈도, 반복 등장, 영향도 기준의 뉴스 기반 랭킹입니다.

1. #키워드
- 왜 뜨나: ...
- 체크 포인트: ...

2. #키워드
- 왜 뜨나: ...
- 체크 포인트: ...

...

한 줄 흐름:
"..."

참고 기사
- 기사 제목

뉴스 후보:
${sourceText}
`.trim();
}

export function buildCardScriptPrompt(keyword, sourceText, personWarning = "") {
  return `
오늘 날짜: ${kstDateLabel()}
카드뉴스 주제: ${keyword}

아래 뉴스 후보를 바탕으로 카드뉴스 1장짜리 기획안을 JSON으로 작성해줘.

${baseRules("- 제목은 짧고 강하게 쓴다.\n- 본문 문장은 모바일 카드뉴스에 들어갈 수 있게 짧게 쓴다.\n- 투자 권유처럼 쓰지 않는다.\n- JSON 외의 설명은 절대 쓰지 않는다.")}
${personWarning ? `\n인물 키워드 주의:\n${personWarning}\n` : ""}

반드시 이 JSON 구조만 반환해:
{
  "title": "카드뉴스 제목",
  "subtitle": "한 줄 부제",
  "bullets": [
    "핵심 문장 1",
    "핵심 문장 2",
    "핵심 문장 3"
  ],
  "footer": "체크할 변수 한 줄",
  "caption": "텔레그램 사진 캡션용 짧은 설명",
  "sources": [
    "기사 제목"
  ]
}

뉴스 후보:
${sourceText}
`.trim();
}

export function formatCardScriptMessage(keyword, cardScript, options = {}) {
  const sources = (cardScript.sources || []).slice(0, 5);
  const bullets = (cardScript.bullets || []).slice(0, 5);
  const storedLabel = options.fromStorage ? "저장된 제작 스크립트" : "제작 스크립트";

  return [
    `🧾 카드뉴스 ${storedLabel}: ${keyword}`,
    "",
    `제목: ${cardScript.title || "-"}`,
    `부제: ${cardScript.subtitle || "-"}`,
    "",
    "본문 문안:",
    ...bullets.map((bullet, index) => `${index + 1}. ${bullet}`),
    "",
    `하단 문구: ${cardScript.footer || "-"}`,
    `사진 캡션: ${cardScript.caption || "-"}`,
    "",
    "참고 기사:",
    ...(sources.length ? sources.map((source) => `- ${source}`) : ["- 없음"])
  ].join("\n");
}

export function buildCardImagePrompt(cardScript) {
  const bullets = (cardScript.bullets || []).slice(0, 3).join(" / ");

  return `
Create a premium Korean news card image for Telegram.

Canvas:
- Portrait social card, clean newsroom style, suitable for mobile.
- High contrast, modern editorial design.
- Use Korean typography.
- Keep text large and readable.
- Do not use logos, stock tickers, copyrighted brand marks, or fake newspaper mastheads.

Text to include exactly in Korean:
Title: ${cardScript.title}
Subtitle: ${cardScript.subtitle}
Bullets: ${bullets}
Footer: ${cardScript.footer}

Visual direction:
- Sophisticated financial-news visual style.
- Use simple charts, abstract market lines, calendar or globe motifs if relevant.
- Avoid clutter.
`.trim();
}

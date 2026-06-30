import { personKeywordGuardEnabled, personKeywordMinContextMatch } from "./config.js";

const PERSON_CONTEXT_WORDS = [
  "대통령", "총리", "장관", "의원", "대표", "후보", "시장", "도지사", "교육감", "감독", "선수", "배우",
  "가수", "방송인", "교수", "회장", "사장", "대표이사", "의사", "변호사", "작가", "기자", "유튜버",
  "축구", "야구", "농구", "정치", "경제", "기업", "재판", "수사", "사건", "논란", "발언", "인터뷰"
];

const COMMON_NON_PERSON_WORDS = new Set([
  "금리", "환율", "유가", "날씨", "삼성", "현대", "정부", "국회", "서울", "부산", "코스피", "코스닥", "비트코인"
]);

export function looksLikeKoreanPersonName(keyword = "") {
  if (!personKeywordGuardEnabled()) {
    return false;
  }

  const value = String(keyword).replace(/\s+/g, "");
  return /^[가-힣]{2,4}$/.test(value) && !COMMON_NON_PERSON_WORDS.has(value);
}

export function buildPersonKeywordWarning(keyword, sourceText = "") {
  if (!looksLikeKoreanPersonName(keyword)) {
    return "";
  }

  const titles = String(sourceText)
    .split(/\n\s*\n/g)
    .map((block) => (block.match(/^제목:\s*(.+)$/m) || [])[1]?.trim())
    .filter(Boolean)
    .slice(0, 12);

  const titlesWithName = titles.filter((title) => title.includes(keyword)).length;
  const contexts = new Set();

  for (const title of titles) {
    for (const word of PERSON_CONTEXT_WORDS) {
      if (title.includes(word)) {
        contexts.add(word);
      }
    }
  }

  const contextList = [...contexts].slice(0, 8);
  const minMatch = personKeywordMinContextMatch();

  let warning;
  if (titlesWithName < minMatch) {
    warning = `‘${keyword}’은 인물명 가능성이 있으나 최근 기사 제목에서 동일 인물로 볼 근거가 부족합니다.`;
  } else if (contextList.length >= 4) {
    warning = `‘${keyword}’은 동명이인 가능성이 있어 직함·소속·사건명이 같은 기사만 근거로 사용해야 합니다.`;
  } else {
    warning = `‘${keyword}’은 인물명 가능성이 있으므로 직함·소속·사건명 일치 여부를 확인했습니다.`;
  }

  return [
    "⚠️ 인물 키워드 검증",
    warning,
    contextList.length ? `확인된 맥락어: ${contextList.join(", ")}` : "확인된 맥락어가 부족합니다.",
    ""
  ].join("\n");
}

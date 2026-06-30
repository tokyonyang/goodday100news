import { XMLParser } from "fast-xml-parser";
import { defaultRegion, effectiveNewsLookbackHours, excludeUnknownPublishedAt } from "./config.js";
import { collectWeatherSource, isWeatherTopic } from "./weather.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

const MORNING_QUERIES = [
  ["국내 주요 뉴스", "한국 경제 환율 증시 정책 금융"],
  ["경제 & 증시", "코스피 코스닥 반도체 AI 환율 유가 금리"],
  ["국제 뉴스", "미국 고용지표 연준 금리 중국 PMI 세계 경제"],
  ["투자 포인트", "오늘 증시 투자 포인트 외국인 매매 반도체 환율"]
];

const TREND_QUERIES = [
  ["종합", "오늘 주요 뉴스 속보"],
  ["경제", "오늘 경제 이슈 증시 환율 금리"],
  ["정치", "오늘 정치 이슈 정부 국회"],
  ["사회", "오늘 사회 이슈 사건 사고"],
  ["국제", "오늘 국제 이슈 미국 중국"],
  ["산업/기술", "오늘 산업 IT AI 반도체"],
  ["문화/스포츠", "오늘 문화 스포츠 이슈"]
];

function googleNewsRssUrl(query) {
  const hours = effectiveNewsLookbackHours();
  const days = Math.max(1, Math.ceil(hours / 24));
  const region = defaultRegion() || "KR";
  const encoded = encodeURIComponent(`${query} when:${days}d`);
  return `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=${region}&ceid=${region}:ko`;
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function asArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function parsePublishedTime(value) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRecentItem(item) {
  const cutoff = Date.now() - effectiveNewsLookbackHours() * 60 * 60 * 1000;

  if (!item.publishedTime) {
    return !excludeUnknownPublishedAt();
  }

  return item.publishedTime >= cutoff;
}

async function fetchRssItems(query, section = "뉴스") {
  const response = await fetch(googleNewsRssUrl(query), {
    headers: {
      "User-Agent": "telegram-news-vercel/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Google News RSS error ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const items = asArray(parsed?.rss?.channel?.item);

  return items
    .map((item) => ({
      section,
      query,
      title: stripHtml(item.title),
      link: item.link || "",
      publishedAt: item.pubDate || "",
      publishedTime: parsePublishedTime(item.pubDate),
      summary: stripHtml(item.description)
    }))
    .filter(isRecentItem);
}

function dedupeAndLimit(items, maxTotalItems) {
  const seen = new Set();
  const result = [];

  const sorted = [...items].sort((a, b) => (b.publishedTime || 0) - (a.publishedTime || 0));

  for (const item of sorted) {
    const key = item.title.replace(/\s+-\s+[^-]+$/, "").toLowerCase();
    if (!item.title || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);

    if (result.length >= maxTotalItems) {
      break;
    }
  }

  return result;
}

export async function collectMorningNews() {
  const groups = await fetchQueryGroups(MORNING_QUERIES);
  const newsText = formatNewsItems(dedupeAndLimit(groups.flat(), 36));
  const weatherText = await collectWeatherSource();

  return [
    "[기준] 한국 / 한국시간 / 최근 48시간 이내 기사만 근거로 사용",
    weatherText,
    newsText
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function collectTrendingNews() {
  const groups = await fetchQueryGroups(TREND_QUERIES);

  return formatNewsItems(dedupeAndLimit(groups.flat(), 56));
}

export async function collectKeywordNews(keyword) {
  const cleanKeyword = keyword.replace(/\s+/g, " ").trim();
  const queries = [
    cleanKeyword,
    `${cleanKeyword} 최신`,
    `${cleanKeyword} 경제`,
    `${cleanKeyword} 증시`,
    `${cleanKeyword} 전망`
  ];

  const groups = await fetchQueryGroups(queries.map((query) => ["키워드 뉴스", query]));
  const newsText = formatNewsItems(dedupeAndLimit(groups.flat(), 28));

  if (isWeatherTopic(cleanKeyword)) {
    return [
      "[기준] 한국 / 한국시간 / 최근 48시간 이내 기사만 근거로 사용",
      await collectWeatherSource(),
      newsText
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    "[기준] 한국 / 한국시간 / 최근 48시간 이내 기사만 근거로 사용",
    newsText
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function fetchQueryGroups(queryPairs) {
  const results = await Promise.allSettled(
    queryPairs.map(([section, query]) => fetchRssItems(query, section))
  );

  const groups = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      groups.push(result.value);
    } else {
      console.error(result.reason);
    }
  }

  return groups;
}

export function formatNewsItems(items) {
  return items
    .map((item) => {
      const ageHours = item.publishedTime
        ? Math.max(0, Math.round((Date.now() - item.publishedTime) / 36_000) / 100)
        : "미확인";

      return [
        `[섹션] ${item.section}`,
        `검색어: ${item.query}`,
        `제목: ${item.title}`,
        `발행: ${item.publishedAt || "발행일 미확인"}`,
        `경과: ${ageHours}시간`,
        `요약: ${item.summary || "요약 없음"}`,
        `링크: ${item.link}`
      ].join("\n");
    })
    .join("\n\n");
}

export function extractSourceButtons(sourceText, maxButtons = 5) {
  const blocks = String(sourceText || "")
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
  const seen = new Set();
  const buttons = [];

  for (const block of blocks) {
    const title = (block.match(/^제목:\s*(.+)$/m) || [])[1]?.trim();
    const link = (block.match(/^링크:\s*(https?:\/\/\S+)/m) || [])[1]?.trim();

    if (!title || !link || seen.has(link)) {
      continue;
    }

    seen.add(link);
    buttons.push({
      text: `${buttons.length + 1}. ${compactArticleTitle(title)}`,
      url: link
    });

    if (buttons.length >= maxButtons) {
      break;
    }
  }

  return buttons;
}

function compactArticleTitle(title) {
  return String(title)
    .replace(/\s+-\s+[^-]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 54);
}

export function removeRawUrls(text) {
  return String(text || "")
    .replace(/:\s*https?:\/\/\S+/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function env(name, fallback = undefined) {
  const value = process.env[name] || fallback;

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function optionalEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

export function envFlag(name, fallback = "false") {
  return ["1", "true", "yes", "y", "on"].includes(String(optionalEnv(name, fallback)).trim().toLowerCase());
}

export function envInt(name, fallback) {
  const parsed = Number.parseInt(String(optionalEnv(name, String(fallback))).trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function textModel() {
  return optionalEnv("OPENAI_TEXT_MODEL", "gpt-4.1-mini");
}

export function imageModel() {
  return optionalEnv("OPENAI_IMAGE_MODEL", "gpt-4.1-mini");
}

export function defaultRegion() {
  return optionalEnv("DEFAULT_REGION", "KR").trim() || "KR";
}

export function defaultLocale() {
  return optionalEnv("DEFAULT_LOCALE", "ko-KR").trim() || "ko-KR";
}

export function defaultTimezone() {
  return optionalEnv("DEFAULT_TIMEZONE", "Asia/Seoul").trim() || "Asia/Seoul";
}

export function newsLookbackHours() {
  const parsed = envInt("NEWS_LOOKBACK_HOURS", 48);
  return parsed > 0 ? parsed : 48;
}

export function supportingNewsMaxAgeHours() {
  const parsed = envInt("SUPPORTING_NEWS_MAX_AGE_HOURS", 48);
  return parsed > 0 ? parsed : 48;
}

export function effectiveNewsLookbackHours() {
  return Math.min(newsLookbackHours(), supportingNewsMaxAgeHours());
}

export function excludeUnknownPublishedAt() {
  return envFlag("EXCLUDE_UNKNOWN_PUBLISHED_AT", "true");
}

export function weatherEnabled() {
  return envFlag("WEATHER_ENABLED", "true");
}

export function weatherDefaultCity() {
  return optionalEnv("WEATHER_DEFAULT_CITY", "서울").trim() || "서울";
}

export function weatherDefaultLat() {
  return optionalEnv("WEATHER_DEFAULT_LAT", "37.5665").trim() || "37.5665";
}

export function weatherDefaultLon() {
  return optionalEnv("WEATHER_DEFAULT_LON", "126.9780").trim() || "126.9780";
}

export function personKeywordGuardEnabled() {
  return envFlag("PERSON_KEYWORD_GUARD", "true");
}

export function personKeywordMinContextMatch() {
  const parsed = envInt("PERSON_KEYWORD_MIN_CONTEXT_MATCH", 2);
  return parsed > 0 ? parsed : 2;
}

export function linkButtonLimit() {
  const parsed = envInt("TELEGRAM_LINK_BUTTON_LIMIT", 8);
  return parsed > 0 ? parsed : 8;
}

export function cardScriptTtlSeconds() {
  const parsed = envInt("CARD_SCRIPT_TTL_SECONDS", 604800);
  return parsed > 0 ? parsed : 604800;
}

export function kstDateLabel() {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: defaultTimezone(),
    month: "long",
    day: "numeric",
    weekday: "short"
  });

  return formatter.format(new Date()).replace(/\s+/g, " ");
}

export function baseUrlFromRequest(request) {
  const configured = optionalEnv("PUBLIC_BASE_URL");
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

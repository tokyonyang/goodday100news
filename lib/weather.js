import { weatherDefaultCity, weatherDefaultLat, weatherDefaultLon, weatherEnabled } from "./config.js";

const WEATHER_TEXT = new Map([
  [0, "맑음"],
  [1, "대체로 맑음"],
  [2, "구름 조금"],
  [3, "흐림"],
  [45, "안개"],
  [48, "서리 안개"],
  [51, "약한 이슬비"],
  [53, "이슬비"],
  [55, "강한 이슬비"],
  [61, "약한 비"],
  [63, "비"],
  [65, "강한 비"],
  [71, "약한 눈"],
  [73, "눈"],
  [75, "강한 눈"],
  [80, "소나기"],
  [81, "강한 소나기"],
  [82, "매우 강한 소나기"],
  [95, "뇌우"],
  [96, "우박 동반 뇌우"],
  [99, "강한 우박 동반 뇌우"]
]);

export function isWeatherTopic(text = "") {
  return /날씨|기온|비|눈|폭염|한파|미세먼지|우산|weather/i.test(String(text));
}

function weatherCodeText(code) {
  const numeric = Number(code);
  return WEATHER_TEXT.get(numeric) || "상태 확인 필요";
}

export async function fetchKoreaWeather() {
  if (!weatherEnabled()) {
    return null;
  }

  const city = weatherDefaultCity();
  const lat = encodeURIComponent(weatherDefaultLat());
  const lon = encodeURIComponent(weatherDefaultLon());
  const url = [
    "https://api.open-meteo.com/v1/forecast",
    `?latitude=${lat}&longitude=${lon}`,
    "&current=temperature_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    "&timezone=Asia%2FSeoul&forecast_days=1"
  ].join("");

  const response = await fetch(url, {
    headers: { "User-Agent": "goodday100news-weather/1.0" }
  });

  if (!response.ok) {
    throw new Error(`Weather API error ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const daily = data.daily || {};

  return {
    city,
    condition: weatherCodeText(current.weather_code),
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    precipitation: current.precipitation,
    rain: current.rain,
    windSpeed: current.wind_speed_10m,
    minTemperature: Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : undefined,
    maxTemperature: Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : undefined,
    precipitationProbability: Array.isArray(daily.precipitation_probability_max)
      ? daily.precipitation_probability_max[0]
      : undefined
  };
}

export function formatWeatherSource(weather) {
  if (!weather) {
    return "[날씨]\n오늘 날씨 정보를 확인하지 못했습니다.";
  }

  const tips = [];
  if (Number(weather.precipitationProbability) >= 50 || Number(weather.rain) > 0 || Number(weather.precipitation) > 0) {
    tips.push("우산을 챙기는 편이 좋습니다.");
  }
  if (Number(weather.windSpeed) >= 8) {
    tips.push("바람이 강할 수 있어 체감온도를 확인하세요.");
  }
  if (!tips.length) {
    tips.push("외출 전 체감온도와 강수 가능성을 한 번 더 확인하세요.");
  }

  return [
    "[날씨]",
    `기준지역: ${weather.city} / 한국시간 기준`,
    `현재: ${weather.condition} / 기온 ${weather.temperature ?? "-"}℃ / 체감 ${weather.apparentTemperature ?? "-"}℃`,
    `오늘 최저·최고: ${weather.minTemperature ?? "-"}℃ ~ ${weather.maxTemperature ?? "-"}℃`,
    `강수확률: ${weather.precipitationProbability ?? "-"}% / 바람 ${weather.windSpeed ?? "-"}km/h`,
    `생활 포인트: ${tips.join(" ")}`
  ].join("\n");
}

export async function collectWeatherSource() {
  try {
    return formatWeatherSource(await fetchKoreaWeather());
  } catch (error) {
    console.error(error);
    return "[날씨]\n오늘 날씨 정보를 가져오지 못했습니다.";
  }
}

// Google Trends Korea RSS + 시드 키워드 트렌드 수집
//
// 설정 (.env.local):
//
// 1) SEED_KEYWORDS: 직접 모니터링할 키워드 (쉼표 구분)
//    예) SEED_KEYWORDS=AI 에이전트,클로드 코드,MCP 서버,RAG 파이프라인
//    → 이 키워드들의 자동완성을 매일 수집
//
// 2) TREND_SOURCE: 트렌드 소스 선택
//    - "google"  = Google Trends RSS만 (기본값)
//    - "seed"    = 시드 키워드만
//    - "both"    = Google Trends + 시드 키워드 합산

export interface TrendingKeyword {
  title: string;
  approxTraffic: string;
  category?: string;
}

export async function getGoogleTrendingKeywords(limit: number = 5): Promise<TrendingKeyword[]> {
  const source = (process.env.TREND_SOURCE || 'google').trim().toLowerCase();
  const allItems: TrendingKeyword[] = [];

  // Google Trends RSS
  if (source === 'google' || source === 'both') {
    const rssItems = await fetchGoogleTrendsRss(limit);
    allItems.push(...rssItems);
  }

  // 시드 키워드
  if (source === 'seed' || source === 'both') {
    const seedItems = getSeedKeywords();
    allItems.push(...seedItems);
  }

  // 기본 폴백: 설정이 없으면 Google Trends
  if (allItems.length === 0) {
    const rssItems = await fetchGoogleTrendsRss(limit);
    allItems.push(...rssItems);
  }

  // 중복 제거
  const seen = new Set<string>();
  return allItems.filter(item => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

function getSeedKeywords(): TrendingKeyword[] {
  const raw = process.env.SEED_KEYWORDS || '';
  if (!raw.trim()) return [];

  return raw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .map(keyword => ({
      title: keyword,
      approxTraffic: '시드',
      category: '모니터링',
    }));
}

async function fetchGoogleTrendsRss(limit: number): Promise<TrendingKeyword[]> {
  try {
    const url = 'https://trends.google.co.kr/trending/rss?geo=KR';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      console.error('[TRENDS] RSS fetch failed:', response.status);
      return [];
    }

    const xml = await response.text();
    return parseRssItems(xml, limit);
  } catch (error) {
    console.error('[TRENDS] Error fetching Google Trends RSS:', error);
    return [];
  }
}

function parseRssItems(xml: string, limit: number): TrendingKeyword[] {
  const items: TrendingKeyword[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;

  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
    const trafficMatch = itemXml.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/);

    if (titleMatch?.[1]) {
      items.push({
        title: titleMatch[1].trim(),
        approxTraffic: trafficMatch?.[1] || 'N/A',
      });
    }
  }

  return items;
}

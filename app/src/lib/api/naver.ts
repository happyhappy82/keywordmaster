import axios from 'axios';
import crypto from 'crypto';

const NAVER_ADS_API_URL = 'https://api.searchad.naver.com';

// HMAC-SHA256 시그니처 생성 (네이버 공식 문서 기준)
function generateSignature(
  timestamp: string,
  method: string,
  path: string,
  secretKey: string
): string {
  const message = `${timestamp}.${method}.${path}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('base64');
}

// 네이버 API 헤더 생성
function createNaverHeaders(method: string, path: string) {
  const apiKey = process.env.NAVER_API_KEY;
  const secretKey = process.env.NAVER_SECRET_KEY;
  const customerId = process.env.NAVER_CUSTOMER_ID;

  if (!apiKey || !secretKey || !customerId) {
    throw new Error('Naver Ads API credentials not configured');
  }

  const timestamp = Date.now().toString();
  const signature = generateSignature(timestamp, method, path, secretKey);

  console.log('[NAVER API] Creating headers for:', method, path);
  console.log('[NAVER API] Customer ID:', customerId);

  return {
    'X-API-KEY': apiKey,
    'X-Customer': customerId,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
    'Content-Type': 'application/json',
  };
}

// 딜레이 함수
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 특정 키워드들의 검색량 조회 (자동완성용)
export async function getNaverKeywordVolumes(keywords: string[]): Promise<Map<string, number>> {
  const path = '/keywordstool';
  const method = 'GET';
  const headers = createNaverHeaders(method, path);
  const volumeMap = new Map<string, number>();

  // 키워드를 공백 제거하고 5개씩 묶어서 조회
  const cleanedKeywords = keywords.map(k => k.replace(/\s+/g, ''));
  const uniqueKeywords = [...new Set(cleanedKeywords)];

  console.log('[NAVER VOLUME] Total unique keywords:', uniqueKeywords.length);

  // 5개씩 묶어서 API 호출 (딜레이 포함)
  for (let i = 0; i < uniqueKeywords.length; i += 5) {
    const chunk = uniqueKeywords.slice(i, i + 5);

    // 첫 번째 호출이 아니면 딜레이 추가 (API 속도 제한 회피)
    if (i > 0) {
      await delay(300); // 300ms 딜레이
    }

    try {
      const encodedKeywords = chunk.map(k => encodeURIComponent(k)).join(',');
      const fullUrl = `${NAVER_ADS_API_URL}${path}?hintKeywords=${encodedKeywords}&showDetail=1`;

      const response = await axios.get(fullUrl, { headers });
      const keywordList = response.data.keywordList || [];

      // 반환된 키워드 중 요청한 키워드와 일치하는 것 찾기
      for (const item of keywordList) {
        const relKeyword = (item.relKeyword || '').replace(/\s+/g, '').toLowerCase();
        const volume = parseQcCnt(item.monthlyPcQcCnt) + parseQcCnt(item.monthlyMobileQcCnt);

        // 요청한 키워드와 일치하면 저장
        for (const requested of chunk) {
          if (relKeyword === requested.toLowerCase()) {
            volumeMap.set(requested.toLowerCase(), volume);
          }
        }
      }

      console.log(`[NAVER VOLUME] Chunk ${Math.floor(i/5) + 1}: ${chunk.length} keywords processed`);
    } catch (error) {
      console.error('Naver keyword volume error for chunk:', chunk, error);
      // 429 에러면 잠시 더 기다렸다가 재시도
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        console.log('[NAVER VOLUME] Rate limited, waiting 1 second...');
        await delay(1000);
        // 재시도
        try {
          const encodedKeywords = chunk.map(k => encodeURIComponent(k)).join(',');
          const fullUrl = `${NAVER_ADS_API_URL}${path}?hintKeywords=${encodedKeywords}&showDetail=1`;
          const response = await axios.get(fullUrl, { headers });
          const keywordList = response.data.keywordList || [];

          for (const item of keywordList) {
            const relKeyword = (item.relKeyword || '').replace(/\s+/g, '').toLowerCase();
            const volume = parseQcCnt(item.monthlyPcQcCnt) + parseQcCnt(item.monthlyMobileQcCnt);
            for (const requested of chunk) {
              if (relKeyword === requested.toLowerCase()) {
                volumeMap.set(requested.toLowerCase(), volume);
              }
            }
          }
        } catch (retryError) {
          console.error('Naver keyword volume retry failed:', retryError);
        }
      }
    }
  }

  console.log('[NAVER VOLUME] Total volumes found:', volumeMap.size);
  return volumeMap;
}

// 키워드 검색량 및 연관키워드 조회
export async function getNaverKeywordStats(keywords: string[]) {
  const path = '/keywordstool';
  const method = 'GET';
  const headers = createNaverHeaders(method, path);

  // 네이버 API는 한 번에 최대 5개 키워드만 조회 가능
  const keywordChunks: string[][] = [];
  for (let i = 0; i < keywords.length; i += 5) {
    keywordChunks.push(keywords.slice(i, i + 5));
  }

  const allResults: {
    keyword: string;
    monthlyPcQcCnt: number;
    monthlyMobileQcCnt: number;
    totalQcCnt: number;
    compIdx: string;
    relKeywords: string[];
  }[] = [];

  for (const chunk of keywordChunks) {
    try {
      const response = await axios.get(NAVER_ADS_API_URL + path, {
        headers,
        params: {
          hintKeywords: chunk.join(','),
          showDetail: '1',
        },
      });

      const keywordList = response.data.keywordList || [];

      for (const item of keywordList) {
        allResults.push({
          keyword: item.relKeyword,
          monthlyPcQcCnt: parseQcCnt(item.monthlyPcQcCnt),
          monthlyMobileQcCnt: parseQcCnt(item.monthlyMobileQcCnt),
          totalQcCnt: parseQcCnt(item.monthlyPcQcCnt) + parseQcCnt(item.monthlyMobileQcCnt),
          compIdx: item.compIdx || 'LOW',
          relKeywords: [],
        });
      }
    } catch (error) {
      console.error('Naver keyword stats error:', error);
      throw error;
    }
  }

  return allResults;
}

// 연관 키워드 조회 (keywordstool API 활용)
export async function getNaverRelatedKeywords(keyword: string, limit: number = 30) {
  const path = '/keywordstool';
  const method = 'GET';
  const headers = createNaverHeaders(method, path);

  try {
    console.log('[NAVER API] Fetching related keywords for:', keyword);

    // 공백 제거 (네이버 검색광고 API는 공백 없는 키워드 사용)
    const cleanedKeyword = keyword.replace(/\s+/g, '');
    const fullUrl = `${NAVER_ADS_API_URL}${path}?hintKeywords=${encodeURIComponent(cleanedKeyword)}&showDetail=1`;

    console.log('[NAVER API] Original keyword:', keyword);
    console.log('[NAVER API] Cleaned keyword (no spaces):', cleanedKeyword);
    console.log('[NAVER API] Full URL:', fullUrl);

    console.log('[NAVER API] Full URL:', fullUrl);

    const response = await axios.get(fullUrl, { headers });

    console.log('[NAVER API] Response status:', response.status);
    console.log('[NAVER API] Response data:', JSON.stringify(response.data, null, 2).slice(0, 500));

    const keywordList = response.data.keywordList || [];

    // 입력 키워드 제외하고 연관 키워드 반환
    return keywordList
      .filter((item: { relKeyword: string }) =>
        item.relKeyword.toLowerCase() !== keyword.toLowerCase()
      )
      .slice(0, limit)
      .map((item: { relKeyword: string; monthlyPcQcCnt: string; monthlyMobileQcCnt: string }) => ({
        keyword: item.relKeyword,
        volume: parseQcCnt(item.monthlyPcQcCnt) + parseQcCnt(item.monthlyMobileQcCnt),
      }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('[NAVER API] Error status:', error.response?.status);
      console.error('[NAVER API] Error data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[NAVER API] Full URL:', error.config?.url);
      console.error('[NAVER API] Headers:', JSON.stringify(error.config?.headers, null, 2));
    }
    console.error('Naver related keywords error:', error);
    throw error;
  }
}

// 네이버 자동완성 조회 (비공식 API - 인증 불필요)
export async function getNaverAutocomplete(keyword: string) {
  try {
    console.log('[NAVER AUTOCOMPLETE] Fetching for:', keyword);

    // 네이버 검색 자동완성 API - st=100 파라미터가 핵심!
    const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(keyword)}&st=100&r_format=json&r_enc=UTF-8&q_enc=UTF-8`;

    console.log('[NAVER AUTOCOMPLETE] Request URL:', url);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://search.naver.com/',
      },
    });

    console.log('[NAVER AUTOCOMPLETE] Response received');
    console.log('[NAVER AUTOCOMPLETE] Raw response:', JSON.stringify(response.data, null, 2));

    const suggestions: string[] = [];

    // 1. items[0]에서 자동완성 추출
    const items = response.data.items || [];
    if (items[0] && Array.isArray(items[0])) {
      for (const item of items[0]) {
        if (Array.isArray(item) && item[0]) {
          suggestions.push(item[0]);
        }
      }
    }

    // 2. intend 필드에서도 추출 (연관 검색어)
    const intend = response.data.intend || [];
    for (const item of intend) {
      if (item.transQuery && !suggestions.includes(item.transQuery)) {
        suggestions.push(item.transQuery);
      }
    }

    console.log('[NAVER AUTOCOMPLETE] Found', suggestions.length, 'suggestions');

    return suggestions.map((suggestion) => ({
      keyword: suggestion,
      volume: 0,
    }));
  } catch (error) {
    console.error('Naver autocomplete error:', error);
    throw error;
  }
}

// 검색량 문자열 파싱 (< 10 등 처리)
function parseQcCnt(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '< 10') return 0;
  const parsed = parseInt(value.toString().replace(/,/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

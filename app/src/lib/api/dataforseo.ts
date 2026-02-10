import axios, { AxiosInstance } from 'axios';

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3';

// DataForSEO API 클라이언트 생성
export function createDataForSEOClient(): AxiosInstance {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured');
  }

  const credentials = Buffer.from(`${login}:${password}`).toString('base64');

  return axios.create({
    baseURL: DATAFORSEO_BASE_URL,
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });
}

// 검색량 조회
export async function getGoogleSearchVolume(
  keywords: string[],
  locationCode: number = 2410, // South Korea
  languageCode: string = 'ko'
) {
  const client = createDataForSEOClient();

  const payload = [
    {
      keywords,
      location_code: locationCode,
      language_code: languageCode,
    },
  ];

  try {
    const response = await client.post(
      '/keywords_data/google_ads/search_volume/live',
      payload
    );

    if (response.data.status_code !== 20000) {
      throw new Error(response.data.status_message || 'DataForSEO API error');
    }

    const results = response.data.tasks?.[0]?.result || [];

    return results.map((item: {
      keyword: string;
      search_volume: number;
      competition: string;
      cpc: number;
      monthly_searches?: Array<{ month: string; search_volume: number }>;
    }) => ({
      keyword: item.keyword,
      search_volume: item.search_volume || 0,
      competition: item.competition || 'UNKNOWN',
      cpc: item.cpc || 0,
      monthly_searches: item.monthly_searches || [],
    }));
  } catch (error) {
    console.error('DataForSEO search volume error:', error);
    throw error;
  }
}


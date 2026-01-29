import axios from 'axios';

// Google 자동완성 조회 (비공식 API - 무료)
export async function getGoogleAutocomplete(keyword: string) {
  try {
    // Google 자동완성 비공식 API
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}&hl=ko`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer', // 인코딩 처리를 위해 arraybuffer로 받음
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });

    // Buffer를 UTF-8로 디코딩
    const data = Buffer.from(response.data).toString('utf8');
    const result = JSON.parse(data);

    // 응답 형식: ["검색어", ["제안1", "제안2", ...]]
    const suggestions: string[] = result[1] || [];

    return suggestions.map((suggestion) => ({
      keyword: suggestion,
      volume: 0,
    }));
  } catch (error) {
    console.error('Google autocomplete error:', error);
    throw error;
  }
}

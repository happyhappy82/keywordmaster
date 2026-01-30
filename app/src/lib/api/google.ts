// Google 자동완성 조회 (비공식 API - 무료)
export async function getGoogleAutocomplete(keyword: string) {
  // 여러 엔드포인트 시도 (하나 차단되면 다른 것 사용)
  const endpoints = [
    `https://clients1.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}&hl=ko`,
    `https://www.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}&hl=ko`,
    `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}&hl=ko`,
  ];

  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/',
        },
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      const text = await response.text();
      const result = JSON.parse(text);

      // 응답 형식: ["검색어", ["제안1", "제안2", ...]]
      const suggestions: string[] = result[1] || [];

      if (suggestions.length > 0) {
        return suggestions.map((suggestion) => ({
          keyword: suggestion,
          volume: 0,
        }));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Google autocomplete error (${url}):`, error);
    }
  }

  // 모든 엔드포인트 실패 시
  console.error('All Google autocomplete endpoints failed:', lastError);
  return [];
}

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAutocomplete, getGoogleSearchVolume } from '@/lib/api/dataforseo';

// 한글 자음 목록
const KOREAN_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword string is required' },
        { status: 400 }
      );
    }

    console.log('[GOOGLE EXPAND] Starting expanded autocomplete for:', keyword);

    // 모든 자음에 대해 자동완성 조회
    const allResults: { keyword: string; volume: number; source: string }[] = [];
    const seenKeywords = new Set<string>();

    for (const consonant of KOREAN_CONSONANTS) {
      const expandedKeyword = `${keyword} ${consonant}`;

      try {
        const results = await getGoogleAutocomplete(expandedKeyword);

        for (const item of results) {
          const normalizedKeyword = item.keyword.toLowerCase();
          if (!seenKeywords.has(normalizedKeyword)) {
            seenKeywords.add(normalizedKeyword);
            allResults.push({
              keyword: item.keyword,
              volume: 0,
              source: consonant,
            });
          }
        }

        console.log(`[GOOGLE EXPAND] ${consonant}: found ${results.length} suggestions`);
      } catch (error) {
        console.error(`[GOOGLE EXPAND] Error for ${consonant}:`, error);
      }
    }

    console.log('[GOOGLE EXPAND] Total unique keywords:', allResults.length);

    // 검색량 조회 (중복 제거된 키워드들)
    if (allResults.length > 0) {
      try {
        const keywords = allResults.map(item => item.keyword);
        const volumeData = await getGoogleSearchVolume(keywords);

        // 검색량 맵 생성
        const volumeMap = new Map<string, number>(
          volumeData.map((v: { keyword: string; search_volume: number }) => [v.keyword.toLowerCase(), v.search_volume])
        );

        // 검색량 매핑
        for (const item of allResults) {
          item.volume = volumeMap.get(item.keyword.toLowerCase()) || 0;
        }
      } catch (volumeError) {
        console.error('[GOOGLE EXPAND] Volume lookup failed:', volumeError);
      }
    }

    // 검색량 기준 내림차순 정렬
    allResults.sort((a, b) => b.volume - a.volume);

    return NextResponse.json({
      success: true,
      data: allResults,
      count: allResults.length,
    });
  } catch (error) {
    console.error('Google expanded autocomplete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

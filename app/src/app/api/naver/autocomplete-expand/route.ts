import { NextRequest, NextResponse } from 'next/server';
import { getNaverAutocomplete, getNaverKeywordVolumes } from '@/lib/api/naver';

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

    console.log('[NAVER EXPAND] Starting expanded autocomplete for:', keyword);

    // 모든 자음에 대해 자동완성 조회
    const allResults: { keyword: string; volume: number; source: string }[] = [];
    const seenKeywords = new Set<string>();

    for (const consonant of KOREAN_CONSONANTS) {
      const expandedKeyword = `${keyword} ${consonant}`;

      try {
        const results = await getNaverAutocomplete(expandedKeyword);

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

        console.log(`[NAVER EXPAND] ${consonant}: found ${results.length} suggestions`);
      } catch (error) {
        console.error(`[NAVER EXPAND] Error for ${consonant}:`, error);
      }
    }

    console.log('[NAVER EXPAND] Total unique keywords:', allResults.length);

    // 검색량 조회 (중복 제거된 키워드들)
    if (allResults.length > 0) {
      try {
        const keywords = allResults.map(item => item.keyword);
        const volumeMap = await getNaverKeywordVolumes(keywords);

        // 검색량 매핑
        for (const item of allResults) {
          const cleanKeyword = item.keyword.replace(/\s+/g, '').toLowerCase();
          item.volume = volumeMap.get(cleanKeyword) || 0;
        }
      } catch (volumeError) {
        console.error('[NAVER EXPAND] Volume lookup failed:', volumeError);
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
    console.error('Naver expanded autocomplete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

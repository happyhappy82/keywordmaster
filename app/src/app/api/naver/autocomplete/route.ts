import { NextRequest, NextResponse } from 'next/server';
import { getNaverAutocomplete, getNaverKeywordVolumes } from '@/lib/api/naver';

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

    // 1. 자동완성 키워드 가져오기
    const autocompleteResults = await getNaverAutocomplete(keyword);

    if (autocompleteResults.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // 2. 자동완성 키워드들의 검색량 조회
    const keywords = autocompleteResults.map((item: { keyword: string; volume: number }) => item.keyword);

    try {
      const volumeMap = await getNaverKeywordVolumes(keywords);

      // 3. 검색량 데이터 병합
      const resultsWithVolume = autocompleteResults.map((item: { keyword: string; volume: number }) => {
        const cleanKeyword = item.keyword.replace(/\s+/g, '').toLowerCase();
        return {
          keyword: item.keyword,
          volume: volumeMap.get(cleanKeyword) || 0,
        };
      });

      return NextResponse.json({
        success: true,
        data: resultsWithVolume,
        count: resultsWithVolume.length,
      });
    } catch (volumeError) {
      // 검색량 조회 실패시 자동완성만 반환
      console.error('Naver volume lookup failed:', volumeError);
      return NextResponse.json({
        success: true,
        data: autocompleteResults,
        count: autocompleteResults.length,
      });
    }
  } catch (error) {
    console.error('Naver autocomplete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

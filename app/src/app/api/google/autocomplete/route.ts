import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAutocomplete } from '@/lib/api/google';
import { getGoogleSearchVolume } from '@/lib/api/dataforseo';

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
    const autocompleteResults = await getGoogleAutocomplete(keyword);

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
      const volumeData = await getGoogleSearchVolume(keywords);

      // 3. 검색량 데이터 병합
      const volumeMap = new Map(
        volumeData.map((v: { keyword: string; search_volume: number }) => [v.keyword.toLowerCase(), v.search_volume])
      );

      const resultsWithVolume = autocompleteResults.map((item: { keyword: string; volume: number }) => ({
        keyword: item.keyword,
        volume: volumeMap.get(item.keyword.toLowerCase()) || 0,
      }));

      return NextResponse.json({
        success: true,
        data: resultsWithVolume,
        count: resultsWithVolume.length,
      });
    } catch (volumeError) {
      // 검색량 조회 실패시 자동완성만 반환
      console.error('Volume lookup failed:', volumeError);
      return NextResponse.json({
        success: true,
        data: autocompleteResults,
        count: autocompleteResults.length,
      });
    }
  } catch (error) {
    console.error('Google autocomplete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

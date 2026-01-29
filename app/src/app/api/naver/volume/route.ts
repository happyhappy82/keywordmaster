import { NextRequest, NextResponse } from 'next/server';
import { getNaverKeywordStats } from '@/lib/api/naver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    // 최대 100개 키워드로 제한
    const limitedKeywords = keywords.slice(0, 100);

    const results = await getNaverKeywordStats(limitedKeywords);

    // 결과 형식 변환 (Google과 동일한 형식으로)
    const formattedResults = results.map(item => ({
      keyword: item.keyword,
      search_volume: item.totalQcCnt,
      pc_volume: item.monthlyPcQcCnt,
      mobile_volume: item.monthlyMobileQcCnt,
      competition: item.compIdx,
    }));

    return NextResponse.json({
      success: true,
      data: formattedResults,
      count: formattedResults.length,
    });
  } catch (error) {
    console.error('Naver volume API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAutocomplete } from '@/lib/api/google';
import { getNaverAutocomplete } from '@/lib/api/naver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, limit = 30 } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword string is required' },
        { status: 400 }
      );
    }

    // 자동완성만 병렬로 가져오기 (연관검색어 제거 - 비용 절감)
    const [googleAutocomplete, naverAutocomplete] = await Promise.allSettled([
      getGoogleAutocomplete(keyword),
      getNaverAutocomplete(keyword),
    ]);

    const formatResult = (
      result: PromiseSettledResult<{ keyword: string; volume: number }[]>,
      source: 'google' | 'naver',
      type: 'autocomplete'
    ) => {
      if (result.status === 'fulfilled') {
        return result.value.slice(0, limit).map(item => ({
          keyword: item.keyword,
          volume: 0,
          source,
          type,
        }));
      }
      console.error(`${source} ${type} error:`, result.reason);
      return [];
    };

    const results = {
      googleAutocomplete: formatResult(googleAutocomplete, 'google', 'autocomplete'),
      naverAutocomplete: formatResult(naverAutocomplete, 'naver', 'autocomplete'),
    };

    // 전체 데이터 통합
    const allData = [
      ...results.googleAutocomplete,
      ...results.naverAutocomplete,
    ];

    return NextResponse.json({
      success: true,
      keyword,
      data: results,
      allData,
      summary: {
        googleAutocomplete: results.googleAutocomplete.length,
        naverAutocomplete: results.naverAutocomplete.length,
        total: allData.length,
      },
    });
  } catch (error) {
    console.error('Keyword analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

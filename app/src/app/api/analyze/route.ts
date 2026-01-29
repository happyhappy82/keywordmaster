import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAutocomplete, getGoogleRelatedKeywords } from '@/lib/api/dataforseo';
import { getNaverAutocomplete, getNaverRelatedKeywords } from '@/lib/api/naver';

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

    // 모든 소스에서 병렬로 데이터 가져오기 (키워드만, 검색량은 별도 조회)
    const [googleRelated, googleAutocomplete, naverRelated, naverAutocomplete] = await Promise.allSettled([
      getGoogleRelatedKeywords(keyword, limit),
      getGoogleAutocomplete(keyword),
      getNaverRelatedKeywords(keyword, limit),
      getNaverAutocomplete(keyword),
    ]);

    const formatResult = (
      result: PromiseSettledResult<{ keyword: string; volume: number }[]>,
      source: 'google' | 'naver',
      type: 'related' | 'autocomplete'
    ) => {
      if (result.status === 'fulfilled') {
        // 검색량은 0으로 초기화 (별도 조회 필요)
        return result.value.slice(0, limit).map(item => ({
          keyword: item.keyword,
          volume: 0, // 검색량은 나중에 별도 조회
          source,
          type,
        }));
      }
      console.error(`${source} ${type} error:`, result.reason);
      return [];
    };

    const results = {
      googleRelated: formatResult(googleRelated, 'google', 'related'),
      googleAutocomplete: formatResult(googleAutocomplete, 'google', 'autocomplete'),
      naverRelated: formatResult(naverRelated, 'naver', 'related'),
      naverAutocomplete: formatResult(naverAutocomplete, 'naver', 'autocomplete'),
    };

    // 전체 데이터 통합
    const allData = [
      ...results.googleRelated,
      ...results.googleAutocomplete,
      ...results.naverRelated,
      ...results.naverAutocomplete,
    ];

    return NextResponse.json({
      success: true,
      keyword,
      data: results,
      allData,
      summary: {
        googleRelated: results.googleRelated.length,
        googleAutocomplete: results.googleAutocomplete.length,
        naverRelated: results.naverRelated.length,
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

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSearchVolume } from '@/lib/api/dataforseo';
import { getNaverKeywordVolumes } from '@/lib/api/naver';

interface KeywordItem {
  keyword: string;
  source: 'google' | 'naver';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords } = body as { keywords: KeywordItem[] };

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    // Google과 Naver 키워드 분리
    const googleKeywords = [...new Set(
      keywords.filter(k => k.source === 'google').map(k => k.keyword)
    )];
    const naverKeywords = [...new Set(
      keywords.filter(k => k.source === 'naver').map(k => k.keyword)
    )];

    console.log('[BULK VOLUME] Google keywords:', googleKeywords.length);
    console.log('[BULK VOLUME] Naver keywords:', naverKeywords.length);

    // 병렬로 검색량 조회
    const [googleVolumes, naverVolumes] = await Promise.allSettled([
      googleKeywords.length > 0 ? getGoogleSearchVolume(googleKeywords) : Promise.resolve([]),
      naverKeywords.length > 0 ? getNaverKeywordVolumes(naverKeywords) : Promise.resolve(new Map()),
    ]);

    // 결과 맵 생성
    const volumeMap: Record<string, number> = {};

    // Google 검색량 매핑 (공백 제거하여 일관된 키 사용)
    if (googleVolumes.status === 'fulfilled') {
      for (const item of googleVolumes.value) {
        const cleanKeyword = item.keyword.toLowerCase().replace(/\s+/g, '');
        const key = `google:${cleanKeyword}`;
        volumeMap[key] = item.search_volume || 0;
      }
      console.log('[BULK VOLUME] Google volumes mapped:', Object.keys(volumeMap).filter(k => k.startsWith('google:')).length);
    } else {
      console.error('[BULK VOLUME] Google volume error:', googleVolumes.reason);
    }

    // Naver 검색량 매핑 (이미 공백 제거된 상태)
    if (naverVolumes.status === 'fulfilled') {
      const naverMap = naverVolumes.value as Map<string, number>;
      for (const [keyword, volume] of naverMap.entries()) {
        const key = `naver:${keyword.toLowerCase()}`;
        volumeMap[key] = volume;
      }
      console.log('[BULK VOLUME] Naver volumes mapped:', Object.keys(volumeMap).filter(k => k.startsWith('naver:')).length);
    } else {
      console.error('[BULK VOLUME] Naver volume error:', naverVolumes.reason);
    }

    return NextResponse.json({
      success: true,
      volumeMap,
      stats: {
        googleRequested: googleKeywords.length,
        naverRequested: naverKeywords.length,
        totalMapped: Object.keys(volumeMap).length,
      },
    });
  } catch (error) {
    console.error('Bulk volume lookup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

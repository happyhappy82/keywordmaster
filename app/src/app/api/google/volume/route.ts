import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSearchVolume } from '@/lib/api/dataforseo';

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

    const results = await getGoogleSearchVolume(limitedKeywords);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Google volume API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getNaverRelatedKeywords } from '@/lib/api/naver';

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

    const results = await getNaverRelatedKeywords(keyword, limit);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Naver related keywords API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

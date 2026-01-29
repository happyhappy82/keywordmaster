import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAutocomplete } from '@/lib/api/google';

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

    // 자동완성 키워드 가져오기 (무료 API)
    // 검색량은 별도로 "검색량 조회" 버튼을 눌러야만 조회됨 (유료)
    const autocompleteResults = await getGoogleAutocomplete(keyword);

    return NextResponse.json({
      success: true,
      data: autocompleteResults,
      count: autocompleteResults.length,
    });
  } catch (error) {
    console.error('Google autocomplete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

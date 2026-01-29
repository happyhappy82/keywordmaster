import { NextRequest, NextResponse } from 'next/server';

interface ExportData {
  keyword: string;
  source: 'google' | 'naver';
  type: 'related' | 'autocomplete';
  volume: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, filename = 'keywords' } = body as { data: ExportData[]; filename?: string };

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data array is required' },
        { status: 400 }
      );
    }

    // CSV 헤더
    const headers = ['키워드', '소스', '유형', '검색량'];

    // CSV 행 생성
    const rows = data.map(item => [
      `"${item.keyword.replace(/"/g, '""')}"`,
      item.source === 'google' ? '구글' : '네이버',
      item.type === 'related' ? '연관검색어' : '자동완성',
      item.volume.toString(),
    ].join(','));

    // BOM + CSV 콘텐츠 (한글 지원)
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');

    // Response with CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

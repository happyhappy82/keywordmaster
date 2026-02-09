import { NextRequest, NextResponse } from 'next/server';
import { getBacklinkHistory } from '@/lib/api/backlinks';

export async function POST(request: NextRequest) {
  try {
    const { target, dateFrom, dateTo } = await request.json();

    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Target domain is required' }, { status: 400 });
    }

    const data = await getBacklinkHistory(target, dateFrom, dateTo);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Backlink history error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

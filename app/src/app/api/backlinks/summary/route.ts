import { NextRequest, NextResponse } from 'next/server';
import { getBacklinkSummary } from '@/lib/api/backlinks';

export async function POST(request: NextRequest) {
  try {
    const { target } = await request.json();

    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Target domain is required' }, { status: 400 });
    }

    const data = await getBacklinkSummary(target);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Backlink summary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

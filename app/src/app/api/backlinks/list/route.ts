import { NextRequest, NextResponse } from 'next/server';
import { getBacklinkList } from '@/lib/api/backlinks';

export async function POST(request: NextRequest) {
  try {
    const { target, limit = 50, offset = 0, orderBy = 'rank,desc' } = await request.json();

    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Target domain is required' }, { status: 400 });
    }

    const data = await getBacklinkList(target, limit, offset, orderBy);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Backlink list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

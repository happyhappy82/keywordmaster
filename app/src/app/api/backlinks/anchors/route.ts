import { NextRequest, NextResponse } from 'next/server';
import { getAnchorTexts } from '@/lib/api/backlinks';

export async function POST(request: NextRequest) {
  try {
    const { target, limit = 50, offset = 0, orderBy = 'backlinks,desc' } = await request.json();

    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Target domain is required' }, { status: 400 });
    }

    const data = await getAnchorTexts(target, limit, offset, orderBy);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Anchor texts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

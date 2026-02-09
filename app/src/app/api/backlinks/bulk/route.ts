import { NextRequest, NextResponse } from 'next/server';
import { getBulkRanks } from '@/lib/api/backlinks';

export async function POST(request: NextRequest) {
  try {
    const { targets } = await request.json();

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({ error: 'Targets array is required' }, { status: 400 });
    }

    if (targets.length > 1000) {
      return NextResponse.json({ error: 'Maximum 1000 targets allowed' }, { status: 400 });
    }

    const data = await getBulkRanks(targets);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Bulk ranks error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

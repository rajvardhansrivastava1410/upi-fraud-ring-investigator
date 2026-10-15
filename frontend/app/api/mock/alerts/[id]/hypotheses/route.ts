import { NextResponse } from 'next/server';
import a014 from '@/fixtures/hypotheses-A-014.json';
import a051 from '@/fixtures/hypotheses-A-051.json';

const FIXTURES: Record<string, unknown> = { 'A-014': a014, 'A-051': a051 };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Generic fallback so every alert can open the tab.
  return NextResponse.json(FIXTURES[id] ?? { alert_id: id, hypotheses: [], what_ifs: [] });
}
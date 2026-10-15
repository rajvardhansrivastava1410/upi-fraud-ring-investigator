import { NextResponse } from 'next/server';
import g014 from '@/fixtures/graph-A-014.json';
import g051 from '@/fixtures/graph-A-051.json';
import gFallback from '@/fixtures/graph-fallback.json';

const GRAPHS: Record<string, unknown> = { 'A-014': g014, 'A-051': g051 };

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // Return the specific fixture if available, otherwise serve the generic fallback
  // so the demo never crashes on unknown alert IDs.
  const graph = GRAPHS[id] ?? gFallback;
  return NextResponse.json(graph);
}

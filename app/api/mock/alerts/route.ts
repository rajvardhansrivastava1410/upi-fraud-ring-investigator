import { NextResponse } from 'next/server';
import queue from '@/fixtures/alerts.json';

export async function GET() {
  return NextResponse.json(queue);
}
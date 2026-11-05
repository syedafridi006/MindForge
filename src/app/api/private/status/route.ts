import { NextResponse } from 'next/server';
import { hasPrivateSession } from '@/lib/private-session';
export const runtime = 'nodejs';
export async function GET() {
  return NextResponse.json({ authenticated: await hasPrivateSession() });
}

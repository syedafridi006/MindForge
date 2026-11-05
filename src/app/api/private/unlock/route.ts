import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, isValidPasscode, SESSION_COOKIE, sessionCookieOptions } from '@/lib/private-session';

export const runtime = 'nodejs';

// Best-effort per-instance throttling. For a high-risk public deployment, add
// a shared rate-limit service at the edge as well.
const attempts = new Map<string, { count: number; startedAt: number; blockedUntil: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const record = attempts.get(ip);
    if (record && record.blockedUntil > now) {
      return NextResponse.json({ error: 'Too many attempts. Wait 15 minutes before trying again.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((record.blockedUntil - now) / 1000)) } });
    }
    const body = await request.json().catch(() => null);
    const passcode = typeof body?.passcode === 'string' ? body.passcode : '';
    if (!passcode || passcode.length > 256 || !isValidPasscode(passcode)) {
      const current = record && now - record.startedAt < WINDOW_MS ? record : { count: 0, startedAt: now, blockedUntil: 0 };
      current.count += 1;
      if (current.count >= MAX_ATTEMPTS) current.blockedUntil = now + WINDOW_MS;
      attempts.set(ip, current);
      return NextResponse.json({ error: current.blockedUntil ? 'Too many attempts. Wait 15 minutes before trying again.' : 'Incorrect passcode.' }, { status: current.blockedUntil ? 429 : 401 });
    }
    attempts.delete(ip);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('MindForge unlock error:', error);
    return NextResponse.json({ error: 'Private access is not configured correctly.' }, { status: 500 });
  }
}

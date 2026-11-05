import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'mindforge_private_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.MF_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('MF_SESSION_SECRET must contain at least 32 characters.');
  return value;
}

export function isValidPasscode(candidate: string) {
  const expected = process.env.MF_ACCESS_PASSWORD;
  if (!expected) throw new Error('MF_ACCESS_PASSWORD is not configured.');
  if (expected.length < 16) throw new Error('MF_ACCESS_PASSWORD must be at least 16 characters long.');
  const a = createHash('sha256').update(candidate).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createSessionToken() {
  const payload = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${randomBytes(24).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || !nonce || !signature) return false;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(sign(`${expires}.${nonce}`));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function hasPrivateSession() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_SECONDS,
};

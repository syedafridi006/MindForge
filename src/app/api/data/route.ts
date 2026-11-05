import { NextRequest, NextResponse } from 'next/server';
import { hasPrivateSession } from '@/lib/private-session';
import { getDatabase } from '@/lib/server-database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await hasPrivateSession())) return NextResponse.json({ error: 'Locked.' }, { status: 401 });
  try {
    const { data, error } = await getDatabase().from('mindforge_vault').select('data, updated_at').eq('id', 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data: data?.data ?? null, updatedAt: data?.updated_at ?? null });
  } catch (error) {
    console.error('MindForge data read error:', error);
    return NextResponse.json({ error: 'Could not load cloud data. Check the database setup.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await hasPrivateSession())) return NextResponse.json({ error: 'Locked.' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 4_000_000) {
      return NextResponse.json({ error: 'Invalid or oversized data payload.' }, { status: 400 });
    }
    const { error } = await getDatabase().from('mindforge_vault').upsert({ id: 1, data: body, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('MindForge data write error:', error);
    return NextResponse.json({ error: 'Could not save cloud data.' }, { status: 503 });
  }
}

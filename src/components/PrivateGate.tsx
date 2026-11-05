'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { LockKeyhole, ShieldCheck, Cloud, CloudOff, LoaderCircle, LogOut } from 'lucide-react';
import { readLocalData, writeLocalData } from '@/lib/local-data';

type Phase = 'checking' | 'locked' | 'loading' | 'ready' | 'error';

export default function PrivateGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [passcode, setPasscode] = useState('');
  const [message, setMessage] = useState('');
  const [syncState, setSyncState] = useState<'saved' | 'saving' | 'offline'>('saved');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialize = useCallback(async () => {
    setPhase('loading');
    setMessage('');
    const response = await fetch('/api/data', { cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 401 ? 'Your private session expired. Unlock MindForge again.' : 'Could not connect to your cloud database.');
    const result = await response.json();
    if (result.data && typeof result.data === 'object') {
      writeLocalData(result.data);
    } else {
      const local = readLocalData();
      if (Object.keys(local).length) {
        const save = await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(local) });
        if (!save.ok) throw new Error('Your existing browser data could not be migrated to the cloud.');
      }
    }
    setPhase('ready');
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/private/status', { cache: 'no-store' })
      .then(async (r) => r.json())
      .then(async (result) => {
        if (!alive) return;
        if (result.authenticated) await initialize();
        else setPhase('locked');
      })
      .catch(() => { if (alive) { setMessage('Cannot reach the MindForge server. Check your connection and refresh.'); setPhase('error'); } });
    return () => { alive = false; };
  }, [initialize]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const save = async () => {
      setSyncState('saving');
      try {
        const response = await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(readLocalData()) });
        if (!response.ok) throw new Error('sync failed');
        setSyncState('saved');
      } catch {
        setSyncState('offline');
      }
    };
    const changed = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, 900);
    };
    window.addEventListener('mindforge:local-data-changed', changed);
    window.addEventListener('online', changed);
    const initialSync = setTimeout(save, 1200);
    return () => {
      window.removeEventListener('mindforge:local-data-changed', changed);
      window.removeEventListener('online', changed);
      clearTimeout(initialSync);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [phase]);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    setPhase('loading');
    setMessage('');
    try {
      const response = await fetch('/api/private/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not unlock MindForge.');
      setPasscode('');
      await initialize();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not unlock MindForge.');
      setPhase('locked');
    }
  }

  async function logout() {
    await fetch('/api/private/logout', { method: 'POST' }).catch(() => undefined);
    setPhase('locked');
  }

  if (phase !== 'ready') {
    return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b1020', color: '#f4f7ff', fontFamily: 'Arial, sans-serif' }}>
      <form onSubmit={unlock} style={{ width: 'min(100%, 410px)', padding: 30, border: '1px solid #27334d', borderRadius: 22, background: '#111a2e', boxShadow: '0 24px 80px #0008' }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#1e3152', color: '#91baff', marginBottom: 22 }}><LockKeyhole size={26}/></div>
        <div style={{ color: '#91baff', fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>PRIVATE PERSONAL WORKSPACE</div>
        <h1 style={{ fontSize: 30, margin: '9px 0' }}>MindForge</h1>
        <p style={{ color: '#aab6cc', lineHeight: 1.6, marginBottom: 24 }}>Your personal space for focus, learning, ideas and progress. Enter your private passcode to continue.</p>
        {phase !== 'checking' && phase !== 'loading' && <>
          <label htmlFor="mindforge-passcode" style={{ display: 'block', fontSize: 13, marginBottom: 8, color: '#cbd5e1' }}>Private passcode</label>
          <input id="mindforge-passcode" type="password" autoComplete="current-password" value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="Enter your passcode" required style={{ width: '100%', padding: '14px 15px', borderRadius: 11, border: '1px solid #34435f', background: '#0b1222', color: 'white', outline: 'none', boxSizing: 'border-box' }}/>
          <button type="submit" style={{ width: '100%', marginTop: 14, padding: 14, border: 0, borderRadius: 11, background: '#78a8ff', color: '#081326', fontWeight: 800, cursor: 'pointer' }}>Unlock MindForge</button>
        </>}
        {(phase === 'checking' || phase === 'loading') && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#aab6cc', padding: 12 }}><LoaderCircle size={18}/> {phase === 'checking' ? 'Checking private access…' : 'Unlocking and loading your workspace…'}</div>}
        {message && <p role="alert" style={{ color: '#ff9d9d', fontSize: 13, lineHeight: 1.5, marginTop: 14 }}>{message}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, color: '#8493ad', fontSize: 11 }}><ShieldCheck size={15}/> Private session · encrypted connection required</div>
      </form>
    </main>;
  }

  return <>
    <div style={{ position: 'fixed', zIndex: 1000, right: 12, top: 10, display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', border: '1px solid #34435f', borderRadius: 999, background: '#111a2eee', color: '#cbd5e1', font: '11px Arial, sans-serif', boxShadow: '0 4px 20px #0003' }}>
      {syncState === 'saved' ? <Cloud size={14} color="#6ee7b7"/> : syncState === 'saving' ? <LoaderCircle size={14}/> : <CloudOff size={14} color="#fbbf24"/>}
      <span>{syncState === 'saved' ? 'Cloud saved' : syncState === 'saving' ? 'Saving…' : 'Local changes not synced'}</span>
      <button onClick={logout} title="Lock MindForge" aria-label="Lock MindForge" style={{ display: 'grid', placeItems: 'center', border: 0, background: 'transparent', color: '#cbd5e1', cursor: 'pointer', padding: 2 }}><LogOut size={14}/></button>
    </div>
    {children}
  </>;
}

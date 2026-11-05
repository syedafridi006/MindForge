import type { Metadata, Viewport } from 'next';
import './globals.css';
import PrivateGate from '@/components/PrivateGate';
export const metadata: Metadata = { title: 'MindForge — Mind & Body OS', description: 'A personal system for focus, learning, fitness and consistency.', manifest: '/manifest.webmanifest' };
export const viewport: Viewport = { themeColor: '#0b1020', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><PrivateGate>{children}</PrivateGate></body></html>; }

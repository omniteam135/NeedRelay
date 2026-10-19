'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle, LayoutDashboard, Map, Settings, Users, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStats, useHydrated } from '@/lib/store';

const NAV = [
  { href: '/', label: 'Command Center', icon: LayoutDashboard },
  { href: '/ground', label: 'Ground View', icon: Map },
  { href: '/volunteers', label: 'Volunteers', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const stats = useStats();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 mr-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Radio className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-semibold tracking-tight text-sm text-cream">NeedRelay</span>
              <span className="text-[10px] text-cream-muted/70">AI Disaster Response</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                {hydrated ? stats.active : '—'} Active Rescues
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {hydrated ? stats.pending : '—'} Pending
              </span>
            </div>
          </div>
        </div>
        <nav className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-thin">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 px-4 py-3 text-center text-[11px] text-muted-foreground">
        NeedRelay — Multi-Agent AI pipeline for localized disaster response. Demo data resets are available in Settings.
      </footer>
    </div>
  );
}

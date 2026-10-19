'use client';

import { Badge } from '@/components/ui/badge';
import {
  Droplets,
  Utensils,
  HeartPulse,
  LifeBuoy,
  Tent,
  type LucideIcon,
} from 'lucide-react';
import type { NeedType, Severity } from '@/lib/types';
import { cn } from '@/lib/utils';

export const NEED_META: Record<NeedType, { icon: LucideIcon; color: string; bg: string }> = {
  Food: { icon: Utensils, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/40' },
  Water: { icon: Droplets, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/40' },
  Medical: { icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/40' },
  Rescue: { icon: LifeBuoy, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/40' },
  Shelter: { icon: Tent, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' },
};

export function NeedBadge({ need, className }: { need: NeedType; className?: string }) {
  const meta = NEED_META[need];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', meta.bg, meta.color, className)}>
      <Icon className="h-3 w-3" />
      {need}
    </span>
  );
}

const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: 'bg-red-600 text-white border-red-600 animate-pulse-slow',
  High: 'bg-orange-500 text-white border-orange-500',
  Medium: 'bg-amber-500 text-black border-amber-500',
  Low: 'bg-slate-600 text-white border-slate-600',
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <Badge variant="outline" className={cn('border', SEVERITY_STYLES[severity], className)}>
      {severity}
    </Badge>
  );
}

const STATUS_STYLES: Record<string, string> = {
  'Active Rescue': 'bg-red-500/15 text-red-300 border-red-500/40',
  'Pending Verification': 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  Resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'Duplicate Merged': 'bg-slate-500/15 text-slate-300 border-slate-500/40',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status] ?? STATUS_STYLES['Pending Verification'], className)}>
      {status}
    </Badge>
  );
}

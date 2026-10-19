'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock, Link2, Navigation, CheckCircle2 } from 'lucide-react';
import type { Incident } from '@/lib/types';
import { NeedBadge, SeverityBadge, StatusBadge } from './incident-badges';
import { cn } from '@/lib/utils';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function IncidentCard({
  incident,
  className,
  onResolve,
  showSources = false,
}: {
  incident: Incident;
  className?: string;
  onResolve?: (incident: Incident) => void;
  showSources?: boolean;
}) {
  const e = incident.extraction;
  return (
    <Card
      className={cn(
        'p-4 bg-card/80 border-border/80 animate-fade-in',
        incident.severity === 'Critical' && 'border-red-500/50',
        incident.status === 'Duplicate Merged' && 'opacity-60',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <NeedBadge need={e.needType} />
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
          <Clock className="h-3 w-3" />
          {timeAgo(incident.updatedAt)}
        </span>
      </div>

      <p className="text-sm text-foreground/90 mb-3">{e.translatedSummary || e.needDetail}</p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{e.city}, {e.district}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{e.affectedPeople} affected</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">Landmark: {e.landmark}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="text-[10px]">
          <Link2 className="h-3 w-3 mr-1" />
          {incident.confirmationCount} source{incident.confirmationCount !== 1 ? 's' : ''}
        </Badge>
        {incident.masterId && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            merged into {incident.masterId.slice(0, 12)}
          </Badge>
        )}
      </div>

      {showSources && incident.sources.length > 0 && (
        <div className="mt-2 border-t border-border/60 pt-2 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Source messages</p>
          {incident.sources.map((s) => (
            <div key={s.messageId} className="text-[11px] rounded bg-secondary/40 px-2 py-1">
              <span className="text-muted-foreground">[{s.channel}] {s.senderName}:</span>{' '}
              <span className="text-foreground/80">{s.originalText}</span>
            </div>
          ))}
        </div>
      )}

      {incident.routing && (
        <div className="mt-2 border-t border-border/60 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Routing recommendation</p>
          <div className="rounded-md bg-secondary/40 p-2 text-xs">
            <div className="flex items-center gap-1.5 mb-1">
              <Navigation className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium">{incident.routing.ngoName}</span>
              <span className="text-muted-foreground">· {incident.routing.distanceKm}km · ETA {incident.routing.etaMinutes}m</span>
            </div>
            <p className="text-muted-foreground text-[11px]">{incident.routing.notes}</p>
            {incident.routing.matchedSupplies.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {incident.routing.matchedSupplies.map((sup) => (
                  <Badge key={sup.id} variant="outline" className="text-[10px]">
                    {sup.quantity}× {sup.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {onResolve && incident.status === 'Active Rescue' && (
        <button
          onClick={() => onResolve(incident)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-1.5 transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Submit Proof of Delivery
        </button>
      )}

      {incident.status === 'Resolved' && incident.resolvedAt && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved {timeAgo(incident.resolvedAt)}
        </div>
      )}
    </Card>
  );
}

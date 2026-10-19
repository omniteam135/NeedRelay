'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, MapPin, Users, Filter, AlertTriangle, ChevronDown, ChevronRight, ShieldAlert, Layers, List } from 'lucide-react';
import { useStore, useHydrated } from '@/lib/store';
import { IncidentCard } from '@/components/incident-card';
import { PodDialog } from '@/components/pod-dialog';
import { ReportEmergencyDialog } from '@/components/report-emergency-dialog';
import { processIncomingMessage } from '@/lib/agents/pipeline';
import { PAKISTAN_REGIONS } from '@/lib/mock-data';
import { NEED_META } from '@/components/incident-badges';
import type { Incident, NeedType, Severity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Leaflet touches `window` at import time — must be client-only.
const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">Loading map…</div>,
});

const SEVERITY_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function GroundViewPage() {
  const hydrated = useHydrated();
  const store = useStore();
  const [needFilter, setNeedFilter] = useState<NeedType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [podIncident, setPodIncident] = useState<Incident | null>(null);
  const [podOpen, setPodOpen] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const incidents = useMemo(() => {
    return store.incidents
      .filter((i) => i.status !== 'Duplicate Merged')
      .filter((i) => needFilter === 'All' || i.extraction.needType === needFilter)
      .filter((i) => statusFilter === 'All' || i.status === statusFilter)
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [store.incidents, needFilter, statusFilter]);

  // Group by region → district
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, Incident[]>> = {};
    for (const inc of incidents) {
      const region = inferRegion(inc.extraction.district);
      const district = inc.extraction.district || 'Unknown';
      if (!map[region]) map[region] = {};
      if (!map[region][district]) map[region][district] = [];
      map[region][district].push(inc);
    }
    return map;
  }, [incidents]);

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const openPod = (incident: Incident) => {
    setPodIncident(incident);
    setPodOpen(true);
  };

  if (!hydrated) return <div className="p-8 text-muted-foreground text-sm">Loading ground view…</div>;

  const mappableIncidents = incidents.filter((i) => i.extraction.lat != null && i.extraction.lng != null);

  const handleReport = async (payload: { text: string; photoUrl: string | null; gps: { lat: number; lng: number } | null }) => {
    await processIncomingMessage(
      {
        channel: 'WhatsApp',
        senderName: 'Citizen Self-Report',
        senderContact: 'Self',
        text: payload.text,
        lang: 'Mixed',
      },
      { gps: payload.gps, photoUrl: payload.photoUrl },
    );
    toast.success('Report submitted — agents are processing it now.');
  };

  return (
    <div className="px-3 sm:px-6 py-4 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Ground View — Incidents by Region</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card/60 border border-border/80 rounded-md p-0.5">
            <button
              onClick={() => setView('map')}
              className={cn('text-[11px] px-2.5 py-1 rounded flex items-center gap-1 transition-colors', view === 'map' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <Layers className="h-3 w-3" /> Map
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('text-[11px] px-2.5 py-1 rounded flex items-center gap-1 transition-colors', view === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="h-3 w-3" /> List
            </button>
          </div>
          <Button size="sm" onClick={() => setReportOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <ShieldAlert className="h-3.5 w-3.5" /> Report Emergency
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 mb-4 bg-card/60 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground mr-1">Need</span>
          <FilterChip active={needFilter === 'All'} onClick={() => setNeedFilter('All')}>All</FilterChip>
          {(Object.keys(NEED_META) as NeedType[]).map((n) => (
            <FilterChip key={n} active={needFilter === n} onClick={() => setNeedFilter(n)}>{n}</FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground mr-1">Status</span>
          {['All', 'Active Rescue', 'Pending Verification', 'Resolved'].map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</FilterChip>
          ))}
        </div>
      </Card>

      {/* Map view */}
      {view === 'map' && (
        <Card className="p-0 mb-4 bg-card/40 overflow-hidden border-border/80">
          <div className="h-[440px] sm:h-[520px] relative">
            <MapView
              incidents={mappableIncidents}
              volunteers={store.volunteers}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              center={[30.1575, 71.5249]}
              zoom={6}
            />
          </div>
          <div className="px-3 py-2 bg-secondary/30 border-t border-border/60 flex items-center flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" /> High</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" /> Medium</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low / Resolved</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Volunteer</span>
            <span className="ml-auto">{mappableIncidents.length} of {incidents.length} incidents mapped</span>
          </div>
        </Card>
      )}

      {/* Region grid */}
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">No incidents match the current filters.</Card>
        )}
        {PAKISTAN_REGIONS.map((region) => {
          const districts = grouped[region.name];
          if (!districts) return null;
          const regionIncidents = Object.values(districts).flat();
          const affected = regionIncidents.reduce((s, i) => s + i.extraction.affectedPeople, 0);
          const critical = regionIncidents.filter((i) => i.severity === 'Critical').length;
          return (
            <div key={region.name} className="rounded-xl border border-border/80 overflow-hidden bg-card/40">
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">{region.name}</h2>
                  <Badge variant="outline" className="text-[10px]">{regionIncidents.length} incidents</Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {affected} affected
                  </span>
                  {critical > 0 && (
                    <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-400">
                      <AlertTriangle className="h-3 w-3 mr-1" /> {critical} critical
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Object.entries(districts).map(([district, incs]) => {
                  const key = `${region.name}-${district}`;
                  const isOpen = expanded[key] ?? true;
                  return (
                    <div key={key} className="rounded-lg border border-border/60 bg-background/40">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
                      >
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {district} District
                        </span>
                        <Badge variant="secondary" className="text-[10px]">{incs.length}</Badge>
                      </button>
                      {isOpen && (
                        <div className="p-2 space-y-2">
                          {incs.map((inc) => (
                            <IncidentCard key={inc.id} incident={inc} onResolve={openPod} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <PodDialog
        incident={podIncident}
        volunteer={podIncident ? store.volunteers.find((v) => v.id === podIncident.assignedVolunteerId) ?? null : null}
        open={podOpen}
        onOpenChange={setPodOpen}
      />

      <ReportEmergencyDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSubmit={handleReport}
      />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-[11px] px-2 py-0.5 rounded border transition-colors',
        active ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function inferRegion(district: string): string {
  for (const r of PAKISTAN_REGIONS) {
    if (r.districts.some((d) => d.toLowerCase() === district.toLowerCase())) return r.name;
  }
  // City → region fallback
  const map: Record<string, string> = {
    karachi: 'Sindh', lahore: 'Punjab', multan: 'Punjab', shujabad: 'Punjab',
  };
  return map[district.toLowerCase()] ?? 'Other';
}

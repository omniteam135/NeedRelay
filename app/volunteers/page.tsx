'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Phone,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Package,
  Building2,
  Truck,
} from 'lucide-react';
import { useStore, useHydrated } from '@/lib/store';
import { IncidentCard } from '@/components/incident-card';
import { PodDialog } from '@/components/pod-dialog';
import { NeedBadge } from '@/components/incident-badges';
import type { Incident, Volunteer } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function VolunteersPage() {
  const hydrated = useHydrated();
  const store = useStore();
  const [podIncident, setPodIncident] = useState<Incident | null>(null);
  const [podOpen, setPodOpen] = useState(false);
  const [podVolunteer, setPodVolunteer] = useState<Volunteer | null>(null);

  if (!hydrated) return <div className="p-8 text-muted-foreground text-sm">Loading volunteer portal…</div>;

  const deployedVolunteers = store.volunteers.filter((v) => v.status === 'Deployed');
  const availableVolunteers = store.volunteers.filter((v) => v.status === 'Available');

  const tasksForVolunteer = (volId: string) =>
    store.incidents.filter((i) => i.assignedVolunteerId === volId && i.status === 'Active Rescue');
  const completedForVolunteer = (volId: string) =>
    store.incidents.filter((i) => i.assignedVolunteerId === volId && i.status === 'Resolved');

  const openPod = (incident: Incident, volunteer: Volunteer) => {
    setPodIncident(incident);
    setPodVolunteer(volunteer);
    setPodOpen(true);
  };

  return (
    <div className="px-3 sm:px-6 py-4 max-w-[1500px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Volunteer & NGO Portal</h1>
        <Badge variant="outline" className="text-[10px]">{store.volunteers.length} workers</Badge>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="bg-card/60">
          <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="ngos">NGOs & Inventory</TabsTrigger>
        </TabsList>

        {/* Active tasks auto-assigned by Agent 3 */}
        <TabsContent value="tasks" className="space-y-3">
          <Card className="p-3 bg-card/60">
            <p className="text-xs text-muted-foreground">
              Tasks below were auto-assigned by <span className="text-foreground font-medium">Agent 3 — Logistics &amp; Matching</span>. Volunteers can submit Proof of Delivery to trigger Agent 4.
            </p>
          </Card>
          {deployedVolunteers.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No active deployments. When Agent 3 matches a volunteer to an incident, the task appears here.
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deployedVolunteers.map((vol) => {
              const tasks = tasksForVolunteer(vol.id);
              return tasks.map((inc) => (
                <div key={inc.id} className="space-y-2">
                  <VolunteerTaskHeader volunteer={vol} incident={inc} />
                  <IncidentCard incident={inc} onResolve={(i) => openPod(i, vol)} />
                </div>
              ));
            })}
          </div>
        </TabsContent>

        {/* Volunteers directory */}
        <TabsContent value="volunteers" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {store.volunteers.map((vol) => {
              const active = tasksForVolunteer(vol.id);
              const done = completedForVolunteer(vol.id);
              return (
                <Card key={vol.id} className={cn('p-4 bg-card/80', vol.status === 'Deployed' && 'border-accent/50')}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-foreground text-xs">
                        {vol.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vol.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {vol.ngoName}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {vol.baseCity}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {vol.skills.map((s) => (
                          <NeedBadge key={s} need={s} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            vol.status === 'Available' && 'border-emerald-500/40 text-emerald-400',
                            vol.status === 'Deployed' && 'border-accent/50 text-accent',
                            vol.status === 'Offline' && 'border-muted text-muted-foreground',
                          )}
                        >
                          {vol.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-0.5"><Truck className="h-3 w-3" />{active.length}</span>
                          <span className="flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />{done.length}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* NGOs and inventory */}
        <TabsContent value="ngos" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {store.ngos.map((ngo) => {
              const inv = store.inventory.filter((i) => i.ngoId === ngo.id);
              const vol = store.volunteers.filter((v) => v.ngoId === ngo.id);
              return (
                <Card key={ngo.id} className="p-4 bg-card/80">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ngo.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {ngo.baseCity} · <Phone className="h-3 w-3" /> {ngo.contactPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {vol.length} volunteers</span>
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {inv.length} supply types</span>
                  </div>
                  <div className="space-y-1">
                    {inv.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs rounded bg-secondary/40 px-2 py-1">
                        <span className="flex items-center gap-1.5">
                          <NeedBadge need={item.category} />
                          <span className="text-foreground/80">{item.name}</span>
                        </span>
                        <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <PodDialog incident={podIncident} volunteer={podVolunteer} open={podOpen} onOpenChange={setPodOpen} />
    </div>
  );
}

function VolunteerTaskHeader({ volunteer, incident }: { volunteer: Volunteer; incident: Incident }) {
  const e = incident.extraction;
  return (
    <Card className="p-3 bg-accent/10 border-accent/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-secondary text-foreground text-[10px]">
              {volunteer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium">{volunteer.name}</p>
            <p className="text-[10px] text-muted-foreground">{volunteer.ngoName}</p>
          </div>
        </div>
        {incident.routing && (
          <div className="text-right text-[10px] text-muted-foreground">
            <p className="flex items-center gap-1 justify-end"><Navigation className="h-3 w-3" /> {incident.routing.distanceKm}km</p>
            <p className="flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> ETA {incident.routing.etaMinutes}m</p>
          </div>
        )}
      </div>
      <p className="text-[11px] text-foreground/70 mt-1.5">
        Auto-assigned to deliver <span className="font-medium">{e.needType}</span> at {e.landmark}, {e.city}
      </p>
    </Card>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Activity,
  CheckCircle2,
  Users,
  Send,
  Sparkles,
  Zap,
  MessageSquare,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Radio,
  MapPin,
  ShieldCheck,
  Bot,
  LifeBuoy,
  Waves,
  HeartHandshake,
} from 'lucide-react';
import { useStore, useStats, useHydrated } from '@/lib/store';
import { processIncomingMessage } from '@/lib/agents/pipeline';
import { SAMPLE_INCOMING_MESSAGES } from '@/lib/mock-data';
import { IncidentCard } from '@/components/incident-card';
import { AgentStatusPanel } from '@/components/agent-status-panel';
import { PodDialog } from '@/components/pod-dialog';
import { NeedBadge } from '@/components/incident-badges';
import type { Incident, MessageChannel, RawMessage, Volunteer } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CHANNELS: MessageChannel[] = ['WhatsApp', 'Voice Note', 'SMS', 'Hotline'];

export default function CommandCenterPage() {
  const hydrated = useHydrated();
  const store = useStore();
  const stats = useStats();
  const [input, setInput] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('WhatsApp');
  const [busy, setBusy] = useState(false);
  const [podIncident, setPodIncident] = useState<Incident | null>(null);
  const [podOpen, setPodOpen] = useState(false);
  const sampleIdx = useRef(0);

  const openIncidents = store.incidents
    .filter((i) => i.status === 'Active Rescue' || i.status === 'Pending Verification')
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const resolvedIncidents = store.incidents.filter((i) => i.status === 'Resolved').slice(0, 4);
  const recentMessages = store.messages.slice(0, 6);

  const handleSend = useCallback(async (text: string, ch: MessageChannel) => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const result = await processIncomingMessage({
        channel: ch,
        senderName: `Operator input`,
        senderContact: 'local-input',
        text: text.trim(),
        lang: 'Mixed',
      });
      if (result.merged) {
        toast.success(`Agent 2 merged report into existing incident (${result.incident?.id.slice(0, 12)})`);
      } else if (result.incident) {
        toast.success(`Pipeline complete — new ${result.incident.extraction.needType} incident routed`);
      }
      setInput('');
    } catch (e) {
      toast.error('Pipeline error — check console');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleSample = useCallback(async () => {
    const sample = SAMPLE_INCOMING_MESSAGES[sampleIdx.current % SAMPLE_INCOMING_MESSAGES.length];
    sampleIdx.current += 1;
    await handleSend(sample.text, sample.channel);
  }, [handleSend]);

  const openPod = (incident: Incident) => {
    const vol = store.volunteers.find((v) => v.id === incident.assignedVolunteerId);
    if (!vol) {
      toast.error('No volunteer assigned to this incident yet.');
      return;
    }
    setPodIncident(incident);
    setPodOpen(true);
  };

  if (!hydrated) {
    return <div className="p-8 text-muted-foreground text-sm">Loading command center…</div>;
  }

  return (
    <div className="px-3 sm:px-6 py-4 max-w-[1500px] mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-accent/40 mb-6 animate-fade-in">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute inset-0 hero-grid pointer-events-none opacity-60" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="relative px-5 sm:px-12 py-12 sm:py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-accent/30 px-3 py-1 text-[11px] font-medium text-cream">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cream opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cream" />
                </span>
                LIVE · FLOOD RESPONSE · PAKISTAN
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02]">
                From chaos to{' '}
                <span className="text-cream">coordinated relief</span>
                <br />
                <span className="text-cream-muted text-2xl sm:text-3xl font-semibold">in seconds.</span>
              </h1>
              <p className="text-sm sm:text-base text-cream-muted/80 max-w-xl leading-relaxed">
                NeedRelay turns messy WhatsApp messages, voice notes, and citizen self-reports into
                structured rescue operations. Four AI agents parse, deduplicate, route, and verify
                every incident — while a live map shows responders exactly where help is needed.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/85 text-primary-foreground font-semibold shadow-lg shadow-primary/20">
                  <Link href="/ground">
                    <MapPin className="h-4 w-4" />
                    Open Live Map
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-destructive/60 text-destructive hover:bg-destructive/15 hover:text-destructive font-semibold">
                  <Link href="/ground">
                    <ShieldCheck className="h-4 w-4" />
                    Report an Emergency
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-xl">
                <HeroFact icon={Bot} label="Autonomous agents" value="4" />
                <HeroFact icon={MessageSquare} label="Channels" value="4" />
                <HeroFact icon={MapPin} label="GPS + photos" value="Live" />
                <HeroFact icon={HeartHandshake} label="NGOs ready" value="6" />
              </div>
            </div>

            {/* Right: agent pipeline preview card */}
            <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
              <div className="relative rounded-2xl border border-cream/20 bg-accent/30 backdrop-blur p-5 shadow-2xl shadow-black/40">
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-cream/50 to-transparent" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-cream flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cream" />
                    The 4-Agent Pipeline
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-cream-muted/70">end-to-end</span>
                </div>
                <div className="space-y-2.5">
                  <PipelineStep n={1} title="Ingestion & Translation" desc="Reads raw Roman-Urdu, extracts need, location, urgency." icon={MessageSquare} />
                  <PipelineStep n={2} title="Deduplication & Verification" desc="Merges repeat reports into one escalating incident." icon={ShieldCheck} />
                  <PipelineStep n={3} title="Logistics & Routing" desc="Matches the nearest skilled volunteer + supplies." icon={LifeBuoy} />
                  <PipelineStep n={4} title="Proof-of-Delivery Audit" desc="Verifies the closure message confirms real delivery." icon={CheckCircle2} />
                </div>
                <div className="mt-4 pt-3 border-t border-cream/15 flex items-center justify-between text-[11px]">
                  <span className="text-cream-muted/70">Avg. time to routed ticket</span>
                  <span className="font-mono text-cream font-semibold">~2.5s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatCard label="Active Rescues" value={stats.active} icon={AlertTriangle} accent="text-red-400 border-red-500/40" />
        <StatCard label="Pending Verification" value={stats.pending} icon={Activity} accent="text-amber-400 border-amber-500/40" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} accent="text-emerald-400 border-emerald-500/40" />
        <StatCard label="Affected People" value={stats.affectedPeople} icon={Users} accent="text-sky-400 border-sky-500/40" />
        <StatCard label="Volunteers Available" value={stats.availableVolunteers} icon={Radio} accent="text-accent border-accent/40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Incoming raw messages + input */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 bg-card/80">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Incoming Messages</h2>
                <p className="text-[11px] text-muted-foreground">WhatsApp-style raw feed</p>
              </div>
            </div>

            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {recentMessages.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No messages yet.</p>
              )}
              {recentMessages.map((m: RawMessage) => (
                <div key={m.id} className="rounded-lg bg-secondary/40 p-2.5 border border-border/60">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px]">{m.channel}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1">{m.senderName}</p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 pt-3 space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded border transition-colors',
                      channel === ch
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a raw Roman-Urdu / Urdu message… e.g. 'bhai shadman town me pani gharo me ghus gaya hai'"
                rows={3}
                className="bg-background/60 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSend(input, channel)}
                  disabled={busy || !input.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Relay to Agents
                </Button>
                <Button onClick={handleSample} disabled={busy} variant="outline">
                  <Sparkles className="h-4 w-4" />
                  Sample
                </Button>
              </div>
            </div>
          </Card>

          <AgentStatusPanel />
        </div>

        {/* Middle: Live transformation feed */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 bg-card/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold">Live Pipeline — Raw → Structured</h2>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {openIncidents.length} open
              </Badge>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
              {openIncidents.length === 0 && (
                <p className="text-xs text-muted-foreground py-6 text-center">No active incidents. Relay a message to start the pipeline.</p>
              )}
              {openIncidents.map((incident) => (
                <div key={incident.id}>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                    <MessageSquare className="h-3 w-3" />
                    {incident.sources.length} raw message{incident.sources.length !== 1 ? 's' : ''}
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-foreground/80">structured incident</span>
                  </div>
                  <IncidentCard incident={incident} showSources onResolve={openPod} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Resolved + needs breakdown */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 bg-card/80">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Recently Resolved
            </h2>
            <div className="space-y-2">
              {resolvedIncidents.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 text-center">None yet.</p>
              )}
              {resolvedIncidents.map((inc) => (
                <div key={inc.id} className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <NeedBadge need={inc.extraction.needType} />
                  </div>
                  <p className="text-[11px] text-foreground/80 truncate">{inc.extraction.translatedSummary}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{inc.extraction.city}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-card/80">
            <h2 className="text-sm font-semibold mb-3">Needs Breakdown</h2>
            <NeedsBreakdown />
          </Card>
        </div>
      </div>

      <PodDialog
        incident={podIncident}
        volunteer={podIncident ? store.volunteers.find((v) => v.id === podIncident.assignedVolunteerId) ?? null : null}
        open={podOpen}
        onOpenChange={setPodOpen}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  accent: string;
}) {
  return (
    <Card className={cn('p-3 bg-card/60 border', accent)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </Card>
  );
}

function PipelineStep({
  n,
  title,
  desc,
  icon: Icon,
}: {
  n: number;
  title: string;
  desc: string;
  icon: typeof AlertTriangle;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-cream/15 bg-background/40 p-2.5 hover:border-cream/40 hover:bg-background/60 transition-colors group">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cream text-accent text-[11px] font-bold ring-1 ring-cream/40">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-cream" />
          <span className="text-xs font-medium text-cream">{title}</span>
        </div>
        <p className="text-[11px] text-cream-muted/70 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-cream-muted/30 group-hover:text-cream transition-colors" />
    </div>
  );
}

function HeroFact({ icon: Icon, label, value }: { icon: typeof AlertTriangle; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cream/15 bg-accent/20 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-cream">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-lg font-bold leading-none">{value}</span>
      </div>
      <p className="text-[10px] text-cream-muted/70 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function NeedsBreakdown() {
  const store = useStore();
  const counts: Record<string, number> = {};
  store.incidents
    .filter((i) => i.status === 'Active Rescue' || i.status === 'Pending Verification')
    .forEach((i) => {
      counts[i.extraction.needType] = (counts[i.extraction.needType] ?? 0) + 1;
    });
  const needs = (['Rescue', 'Medical', 'Food', 'Water', 'Shelter'] as const);
  const max = Math.max(1, ...needs.map((n) => counts[n] ?? 0));
  return (
    <div className="space-y-2">
      {needs.map((n) => {
        const c = counts[n] ?? 0;
        return (
          <div key={n} className="flex items-center gap-2">
            <span className="text-xs w-16 text-muted-foreground">{n}</span>
            <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${(c / max) * 100}%` }} />
            </div>
            <span className="text-xs font-medium w-6 text-right">{c}</span>
          </div>
        );
      })}
    </div>
  );
}

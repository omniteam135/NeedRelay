'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Key,
  Cpu,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Server,
  Info,
  RefreshCw,
} from 'lucide-react';
import { resetStore, useStore } from '@/lib/store';
import { toast } from 'sonner';

export default function SettingsPage() {
  const store = useStore();
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'configured' | 'missing'>('unknown');
  const [checking, setChecking] = useState(false);

  async function checkKeyStatus() {
    setChecking(true);
    try {
      const res = await fetch('/api/agent/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test connection ping' }),
      });
      if (!res.ok) throw new Error('API error');
      const data = (await res.json()) as { usedLLM: boolean };
      setKeyStatus(data.usedLLM ? 'configured' : 'missing');
    } catch {
      setKeyStatus('missing');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="px-3 sm:px-6 py-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* AI Engine info */}
      <Card className="p-5 bg-card/80">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
          <Cpu className="h-4 w-4 text-accent" /> AI Agent Engine
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          NeedRelay uses <span className="text-foreground font-medium">Groq</span> (model: <span className="text-foreground font-medium">llama3-70b-8192</span>) via LangChain for lightning-fast Urdu/Roman-Urdu parsing. All AI calls are routed through a secure server-side API — your key is never exposed to the browser.
        </p>
        <div className="rounded-md bg-secondary/40 border border-border/60 p-3 space-y-1.5 text-xs">
          <p className="flex items-center gap-1.5 font-medium"><Info className="h-3.5 w-3.5 text-sky-400" /> How the pipeline works</p>
          <p className="text-muted-foreground pl-5">Agent 1 — Groq parses raw Urdu/Roman-Urdu into structured extraction</p>
          <p className="text-muted-foreground pl-5">Agent 2 — Groq checks for duplicate incidents by landmark &amp; district</p>
          <p className="text-muted-foreground pl-5">Agent 3 — Heuristic routing (no LLM needed), runs instantly</p>
          <p className="text-muted-foreground pl-5">Agent 4 — Groq audits volunteer PoD confirmation messages</p>
          <p className="text-muted-foreground pl-5 italic">Without a key, all agents fall back to the built-in heuristic parser automatically.</p>
        </div>
      </Card>

      {/* Groq key — server-side */}
      <Card className="p-5 bg-card/80">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
          <Key className="h-4 w-4 text-primary" /> Groq API Key — Server Configuration
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          The Groq key is set as a <span className="text-foreground font-medium">server environment variable</span> — not stored in the browser. This prevents it from ever being exposed in network traffic or client-side code.
        </p>

        <div className="rounded-md border border-border bg-background/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">Steps to activate Live AI mode:</span>
          </div>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside pl-1">
            <li>Get a free key at <span className="text-foreground font-mono">console.groq.com/keys</span></li>
            <li>Open the <span className="text-foreground font-mono">.env</span> file in this project</li>
            <li>Set <span className="text-foreground font-mono">GROQ_API_KEY=gsk_your_key_here</span></li>
            <li>Optionally set <span className="text-foreground font-mono">GROQ_MODEL=llama3-70b-8192</span></li>
            <li>Restart the dev server — AI agents will automatically use Groq</li>
          </ol>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkKeyStatus}
            disabled={checking}
            className="text-xs"
          >
            {checking ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Check key status
          </Button>
          {keyStatus === 'configured' && (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[11px]">
              <CheckCircle2 className="h-3 w-3 mr-1" /> GROQ_API_KEY is set — Live AI active
            </Badge>
          )}
          {keyStatus === 'missing' && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[11px]">
              <AlertTriangle className="h-3 w-3 mr-1" /> No key found — running in demo mode
            </Badge>
          )}
        </div>
      </Card>

      {/* Pipeline status */}
      <Card className="p-5 bg-card/80">
        <h2 className="text-sm font-semibold mb-3">Pipeline Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Active agents', value: store.agents.length },
            { label: 'Incidents', value: store.incidents.length },
            { label: 'Volunteers', value: store.volunteers.length },
            { label: 'PoD logs', value: store.podLogs.length },
            { label: 'Messages', value: store.messages.length },
            { label: 'NGOs', value: store.ngos.length },
            { label: 'Inventory lines', value: store.inventory.length },
            {
              label: 'Resolved',
              value: store.incidents.filter((i) => i.status === 'Resolved').length,
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded bg-secondary/40 px-3 py-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Reset */}
      <Card className="p-5 bg-card/80 border-destructive/40">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-1 text-destructive">
          <Trash2 className="h-4 w-4" /> Reset Demo Data
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Clears all incidents, messages, and PoD logs stored locally and restores the original seed dataset.
        </p>
        <Button
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={() => {
            resetStore();
            toast.success('Demo data reset to seed state.');
          }}
        >
          <Trash2 className="h-4 w-4" />
          Reset to Seed Data
        </Button>
      </Card>
    </div>
  );
}

'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, AlertCircle, Circle } from 'lucide-react';
import type { AgentStatus } from '@/lib/types';
import { useStore } from '@/lib/store';

const AGENT_ORDER: AgentStatus['id'][] = ['agent-1', 'agent-2', 'agent-3', 'agent-4'];

const STATE_META = {
  idle: { icon: Circle, color: 'text-muted-foreground', label: 'Idle', spin: false },
  working: { icon: Loader2, color: 'text-accent', label: 'Working', spin: true },
  done: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Done', spin: false },
  error: { icon: AlertCircle, color: 'text-destructive', label: 'Error', spin: false },
} as const;

export function AgentStatusPanel({ compact = false }: { compact?: boolean }) {
  const store = useStore();
  const agents = AGENT_ORDER.map((id) => store.agents.find((a) => a.id === id)!).filter(Boolean);

  return (
    <Card className={cn('p-3 bg-card/60', compact && 'p-2')}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Agent Pipeline</h3>
        <span className="text-[10px] text-muted-foreground">4 agents</span>
      </div>
      <div className="space-y-2">
        {agents.map((agent) => {
          const meta = STATE_META[agent.state];
          const Icon = meta.icon;
          return (
            <div key={agent.id} className="flex items-start gap-2.5">
              <div className={cn('mt-0.5', meta.color)}>
                <Icon className={cn('h-4 w-4', meta.spin && 'animate-spin')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{agent.name}</span>
                  <span className={cn('text-[10px] px-1 rounded', meta.color, 'bg-current/10')}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{agent.currentTask}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

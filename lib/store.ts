'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type {
  AgentStatus,
  Incident,
  InventoryItem,
  Ngo,
  PodLogEntry,
  RawMessage,
  Volunteer,
} from './types';
import {
  SEED_INCIDENTS,
  SEED_INVENTORY,
  SEED_NGOS,
  SEED_POD_LOGS,
  SEED_RAW_MESSAGES,
  SEED_VOLUNTEERS,
} from './mock-data';

const STORAGE_KEY = 'needrelay-store-v1';

export interface AppStore {
  messages: RawMessage[];
  incidents: Incident[];
  volunteers: Volunteer[];
  ngos: Ngo[];
  inventory: InventoryItem[];
  podLogs: PodLogEntry[];
  agents: AgentStatus[];
}

export const DEFAULT_AGENTS: AgentStatus[] = [
  { id: 'agent-1', name: 'Ingestion & Translation', role: 'The Interpreter', state: 'idle', currentTask: 'Waiting for incoming messages', lastActivity: Date.now() },
  { id: 'agent-2', name: 'Deduplication & Verification', role: 'The Guard', state: 'idle', currentTask: 'Standing by', lastActivity: Date.now() },
  { id: 'agent-3', name: 'Logistics & Matching', role: 'The Router', state: 'idle', currentTask: 'Standing by', lastActivity: Date.now() },
  { id: 'agent-4', name: 'Proof of Delivery Auditor', role: 'The Auditor', state: 'idle', currentTask: 'Standing by', lastActivity: Date.now() },
];

const initialState: AppStore = {
  messages: SEED_RAW_MESSAGES,
  incidents: SEED_INCIDENTS,
  volunteers: SEED_VOLUNTEERS,
  ngos: SEED_NGOS,
  inventory: SEED_INVENTORY,
  podLogs: SEED_POD_LOGS,
  agents: DEFAULT_AGENTS,
};

let store: AppStore = initialState;
const listeners = new Set<() => void>();

let hydrated = false;

function persist() {
  if (typeof window === 'undefined') return;
  try {
    const { messages, incidents, volunteers, podLogs } = store;
    const subset = { messages, incidents, volunteers, podLogs };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subset));
  } catch {
    // ignore quota errors
  }
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<AppStore>;
    store = {
      ...store,
      messages: saved.messages ?? store.messages,
      incidents: saved.incidents ?? store.incidents,
      volunteers: saved.volunteers ?? store.volunteers,
      podLogs: saved.podLogs ?? store.podLogs,
    };
    emit();
  } catch {
    // corrupt store — keep seed
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  if (typeof window !== 'undefined') hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AppStore {
  return store;
}

export function useStore(): AppStore {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getStore(): AppStore {
  return store;
}

export function setStore(updater: (prev: AppStore) => AppStore): void {
  store = updater(store);
  persist();
  emit();
}

export function updateAgent(id: AgentStatus['id'], patch: Partial<AgentStatus>): void {
  setStore((prev) => ({
    ...prev,
    agents: prev.agents.map((a) => (a.id === id ? { ...a, ...patch, lastActivity: Date.now() } : a)),
  }));
}

export function addMessage(msg: RawMessage): void {
  setStore((prev) => ({ ...prev, messages: [msg, ...prev.messages] }));
}

export function upsertIncident(incident: Incident): void {
  setStore((prev) => {
    const idx = prev.incidents.findIndex((i) => i.id === incident.id);
    if (idx >= 0) {
      const incidents = [...prev.incidents];
      incidents[idx] = incident;
      return { ...prev, incidents };
    }
    return { ...prev, incidents: [incident, ...prev.incidents] };
  });
}

export function addPodLog(entry: PodLogEntry): void {
  setStore((prev) => ({ ...prev, podLogs: [entry, ...prev.podLogs] }));
}

export function resetStore(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  store = initialState;
  emit();
}

/* Convenience hooks for derived counts */
export function useStats() {
  const s = useStore();
  const active = s.incidents.filter((i) => i.status === 'Active Rescue').length;
  const pending = s.incidents.filter((i) => i.status === 'Pending Verification').length;
  const resolved = s.incidents.filter((i) => i.status === 'Resolved').length;
  const merged = s.incidents.filter((i) => i.status === 'Duplicate Merged').length;
  const availableVolunteers = s.volunteers.filter((v) => v.status === 'Available').length;
  const affectedPeople = s.incidents
    .filter((i) => i.status === 'Active Rescue')
    .reduce((sum, i) => sum + i.extraction.affectedPeople, 0);
  return { active, pending, resolved, merged, availableVolunteers, affectedPeople };
}

export function useHydrated() {
  const [hydratedState, setHydrated] = useState(false);
  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, []);
  return hydratedState;
}

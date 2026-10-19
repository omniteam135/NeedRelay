'use client';

import type {
  Incident,
  PodLogEntry,
  RawMessage,
  RoutingRecommendation,
  Severity,
  SourceReport,
  StructuredExtraction,
} from '../types';
import { fallbackExtract, findDuplicateIncidents, matchLogistics } from './fallback';
import { addMessage, addPodLog, getStore, setStore, updateAgent, upsertIncident } from '../store';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/* Call the secure server-side extract endpoint */
async function serverExtract(
  text: string,
  gps: { lat: number; lng: number } | null,
): Promise<StructuredExtraction> {
  try {
    const res = await fetch('/api/agent/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, gps }),
    });
    if (!res.ok) throw new Error('Extract API failed');
    const data = (await res.json()) as { extraction: StructuredExtraction };
    // User-supplied GPS always wins over LLM estimate
    if (gps) return { ...data.extraction, lat: gps.lat, lng: gps.lng };
    return data.extraction;
  } catch {
    const fb = fallbackExtract(text);
    if (gps) return { ...fb, lat: gps.lat, lng: gps.lng };
    return fb;
  }
}

/* Call the secure server-side dedup endpoint */
async function serverDedup(
  extraction: StructuredExtraction,
  existing: { id: string; status: string; extraction: StructuredExtraction }[],
): Promise<{ isDuplicate: boolean; duplicateOf: string | null; reason: string }> {
  try {
    const res = await fetch('/api/agent/dedup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extraction, existing }),
    });
    if (!res.ok) throw new Error('Dedup API failed');
    return (await res.json()) as { isDuplicate: boolean; duplicateOf: string | null; reason: string };
  } catch {
    const ids = findDuplicateIncidents(extraction, existing);
    return {
      isDuplicate: ids.length > 0,
      duplicateOf: ids[0] ?? null,
      reason: ids.length > 0 ? 'Same landmark and district' : 'No duplicate found',
    };
  }
}

/* Call the secure server-side PoD endpoint */
async function serverPodVerdict(podMessage: string, incidentSummary: string): Promise<string> {
  try {
    const res = await fetch('/api/agent/pod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ podMessage, incidentSummary }),
    });
    if (!res.ok) throw new Error('PoD API failed');
    const data = (await res.json()) as { verdict: string };
    return data.verdict;
  } catch {
    const positive = /drop|deliver|success|resolv|done|complete|ration|distributed|saved|rescue|clear/i.test(podMessage);
    return positive
      ? 'ACCEPTED: Delivery confirmed (fallback).'
      : 'REJECTED: Delivery not confirmed (fallback).';
  }
}

/* Agent 1 — Ingestion & Translation */
export async function runAgent1(
  message: RawMessage,
  gps: { lat: number; lng: number } | null = null,
): Promise<StructuredExtraction> {
  updateAgent('agent-1', { state: 'working', currentTask: `Parsing: "${message.text.slice(0, 40)}..."` });
  await sleep(600);
  const extraction = await serverExtract(message.text, gps);
  updateAgent('agent-1', { state: 'done', currentTask: `Extracted ${extraction.needType} @ ${extraction.city}` });
  return extraction;
}

/* Agent 2 — Deduplication & Verification */
export async function runAgent2(
  extraction: StructuredExtraction,
  message: RawMessage,
): Promise<{ incident: Incident; merged: boolean }> {
  updateAgent('agent-2', { state: 'working', currentTask: 'Scanning open incidents for duplicates...' });
  await sleep(700);
  const store = getStore();
  const openIncidents = store.incidents.filter(
    (i) => i.status === 'Active Rescue' || i.status === 'Pending Verification',
  );

  const { isDuplicate, duplicateOf, reason } = await serverDedup(extraction, openIncidents);

  const source: SourceReport = {
    messageId: message.id,
    senderName: message.senderName,
    channel: message.channel,
    originalText: message.text,
    timestamp: message.timestamp,
  };

  if (isDuplicate && duplicateOf) {
    const target = store.incidents.find((i) => i.id === duplicateOf);
    if (target) {
      const mergedIncident: Incident = {
        ...target,
        sources: [...target.sources, source],
        confirmationCount: target.confirmationCount + 1,
        severity: bumpSeverity(target.severity, target.confirmationCount + 1),
        updatedAt: Date.now(),
      };
      upsertIncident(mergedIncident);
      const dupTicket: Incident = {
        id: genId('inc'),
        masterId: target.id,
        status: 'Duplicate Merged',
        severity: mergedIncident.severity,
        extraction,
        sources: [source],
        confirmationCount: 0,
        routing: null,
        assignedVolunteerId: null,
        podLog: [],
        photoUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        resolvedAt: Date.now(),
      };
      upsertIncident(dupTicket);
      updateAgent('agent-2', { state: 'done', currentTask: `Merged into ${target.id} (${reason})` });
      return { incident: mergedIncident, merged: true };
    }
  }

  const newIncident: Incident = {
    id: genId('inc'),
    masterId: null,
    status: 'Pending Verification',
    severity: extraction.urgency,
    extraction,
    sources: [source],
    confirmationCount: 1,
    routing: null,
    assignedVolunteerId: null,
    podLog: [],
    photoUrl: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    resolvedAt: null,
  };
  upsertIncident(newIncident);
  updateAgent('agent-2', { state: 'done', currentTask: `New incident created: ${newIncident.id}` });
  return { incident: newIncident, merged: false };
}

function bumpSeverity(current: Severity, confirmations: number): Severity {
  if (confirmations >= 3) return 'Critical';
  if (confirmations >= 2 && current === 'Medium') return 'High';
  return current;
}

/* Agent 3 — Logistics & Matching (pure heuristic, no LLM needed) */
export async function runAgent3(incident: Incident): Promise<Incident> {
  updateAgent('agent-3', { state: 'working', currentTask: `Matching resources for ${incident.id}...` });
  await sleep(800);
  const store = getStore();
  const match = matchLogistics(incident.extraction, store.volunteers, store.inventory, store.ngos);
  if (!match) {
    updateAgent('agent-3', { state: 'done', currentTask: 'No matching volunteer/supplies found' });
    const updated: Incident = { ...incident, status: 'Active Rescue', updatedAt: Date.now() };
    upsertIncident(updated);
    return updated;
  }
  setStore((prev) => ({
    ...prev,
    volunteers: prev.volunteers.map((v) =>
      v.id === match.volunteer.id ? { ...v, status: 'Deployed' } : v,
    ),
  }));
  const routing: RoutingRecommendation = {
    ngoId: match.ngo.id,
    ngoName: match.ngo.name,
    distanceKm: match.distanceKm,
    volunteerName: match.volunteer.name,
    matchedSupplies: match.supplies,
    etaMinutes: match.etaMinutes,
    notes: `${match.volunteer.name} (${match.volunteer.skills.join(', ')}) dispatched from ${match.volunteer.baseCity}.`,
  };
  const updated: Incident = {
    ...incident,
    status: 'Active Rescue',
    routing,
    assignedVolunteerId: match.volunteer.id,
    updatedAt: Date.now(),
  };
  upsertIncident(updated);
  updateAgent('agent-3', { state: 'done', currentTask: `Assigned ${match.volunteer.name} via ${match.ngo.name}` });
  return updated;
}

/* Agent 4 — Proof of Delivery Auditor */
export async function runAgent4(
  incidentId: string,
  volunteerId: string,
  podMessage: string,
  imageName: string | null,
): Promise<{ accepted: boolean; verdict: string; incident: Incident | null }> {
  updateAgent('agent-4', { state: 'working', currentTask: `Auditing PoD for ${incidentId}...` });
  await sleep(700);
  const store = getStore();
  const incident = store.incidents.find((i) => i.id === incidentId);
  const volunteer = store.volunteers.find((v) => v.id === volunteerId);
  if (!incident || !volunteer) {
    updateAgent('agent-4', { state: 'error', currentTask: 'Incident or volunteer not found' });
    return { accepted: false, verdict: 'Incident or volunteer not found', incident: null };
  }

  const verdict = await serverPodVerdict(podMessage, incident.extraction.translatedSummary);
  const accepted = verdict.toUpperCase().startsWith('ACCEPTED');

  const entry: PodLogEntry = {
    id: genId('pod'),
    incidentId,
    volunteerId,
    volunteerName: volunteer.name,
    message: podMessage,
    imageName,
    timestamp: Date.now(),
    agentVerdict: verdict,
  };
  addPodLog(entry);

  if (accepted) {
    const updated: Incident = {
      ...incident,
      status: 'Resolved',
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
      podLog: [...incident.podLog, entry],
    };
    upsertIncident(updated);
    setStore((prev) => ({
      ...prev,
      volunteers: prev.volunteers.map((v) =>
        v.id === volunteerId ? { ...v, status: 'Available' } : v,
      ),
    }));
    updateAgent('agent-4', { state: 'done', currentTask: `Incident ${incidentId} resolved` });
    return { accepted: true, verdict, incident: updated };
  }

  updateAgent('agent-4', { state: 'done', currentTask: `PoD rejected for ${incidentId}` });
  return { accepted: false, verdict, incident };
}

/* Full pipeline for a new incoming raw message */
export async function processIncomingMessage(
  raw: Omit<RawMessage, 'id' | 'timestamp'>,
  options?: { gps?: { lat: number; lng: number } | null; photoUrl?: string | null },
): Promise<{ message: RawMessage; incident: Incident | null; merged: boolean }> {
  const message: RawMessage = { ...raw, id: genId('msg'), timestamp: Date.now() };
  addMessage(message);
  const extraction = await runAgent1(message, options?.gps ?? null);
  // Attach photo to extraction context by amending needDetail if photo present
  if (options?.photoUrl) {
    extraction.needDetail = `${extraction.needDetail} [Photo attached]`;
  }
  const { incident, merged } = await runAgent2(extraction, message);
  if (!merged && incident) {
    const routed = await runAgent3(incident);
    if (options?.photoUrl && routed) {
      upsertIncident({ ...routed, photoUrl: options.photoUrl });
    }
    return { message, incident: routed, merged: false };
  }
  if (options?.photoUrl && incident) {
    upsertIncident({ ...incident, photoUrl: options.photoUrl });
  }
  return { message, incident, merged };
}

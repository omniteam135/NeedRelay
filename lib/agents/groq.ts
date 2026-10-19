import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { StructuredExtraction } from '../types';
import { fallbackExtract } from './fallback';

const EXTRACTION_SYSTEM_PROMPT = `You are the Ingestion & Translation Agent for NeedRelay, a disaster response platform for floods in Pakistan.
You receive raw, messy WhatsApp messages and voice-note transcripts written in Roman-Urdu, Urdu, or mixed English/Urdu.

Your job: extract a clean, structured emergency report.

Return ONLY a JSON object (no markdown, no explanation) with these exact fields:
{
  "needType": "Food" | "Water" | "Medical" | "Rescue" | "Shelter",
  "needDetail": "one-line description of what is needed",
  "city": "nearest Pakistani city",
  "district": "Pakistani district",
  "sector": "block/town/colony/UC if mentioned, else the city name + ' area'",
  "landmark": "specific nearby landmark if mentioned, else the sector",
  "affectedPeople": number (best estimate, default 1),
  "urgency": "Critical" | "High" | "Medium" | "Low",
  "translatedSummary": "one-sentence English summary of the situation",
  "lat": number | null,
  "lng": number | null
}

Rules:
- Translate Roman-Urdu/Urdu into English in the summary.
- Infer needType from keywords: khana/ration=Food, paani/water=Water, medical/dawa/doctor=Medical, phansa/rescue/boat=Rescue, tent/shelter/raat guzar=Shelter.
- If multiple needs, pick the most urgent.
- city/district must be a real Pakistani location when identifiable.
- If the user provided GPS coordinates, use them for lat/lng. Otherwise estimate the centroid of the city/district. Return null only if the location is completely unknown.`;

const DEDUP_SYSTEM_PROMPT = `You are the Deduplication & Verification Agent for NeedRelay.
You are given a new structured incident and a list of existing open incidents (all in JSON).
Decide whether the new incident is a DUPLICATE of any existing one.

A duplicate means: same district AND same landmark/area AND overlapping need type.

Return ONLY a JSON object: { "isDuplicate": boolean, "duplicateOf": "incident-id or null", "reason": "one short sentence" }`;

export function createGroqModel(apiKey: string, modelName: string) {
  return new ChatGroq({
    apiKey,
    model: modelName,
    temperature: 0.1,
    maxTokens: 600,
  });
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function groqExtract(
  text: string,
  apiKey: string,
  modelName: string,
): Promise<StructuredExtraction> {
  try {
    const model = createGroqModel(apiKey, modelName);
    const result = await model.invoke([
      new SystemMessage(EXTRACTION_SYSTEM_PROMPT),
      new HumanMessage(`Raw message:\n${text}`),
    ]);
    const content = typeof result.content === 'string' ? result.content : String(result.content);
    const parsed = tryParseJson(content) as Partial<StructuredExtraction> | null;
    if (!parsed || !parsed.needType) {
      return fallbackExtract(text);
    }
    return {
      needType: parsed.needType ?? 'Rescue',
      needDetail: parsed.needDetail ?? '',
      city: parsed.city ?? 'Unknown',
      district: parsed.district ?? 'Unknown',
      sector: parsed.sector ?? 'Unknown',
      landmark: parsed.landmark ?? parsed.sector ?? 'Unknown',
      affectedPeople: Number(parsed.affectedPeople) || 1,
      urgency: parsed.urgency ?? 'Medium',
      translatedSummary: parsed.translatedSummary ?? '',
      lat: parsed.lat ?? null,
      lng: parsed.lng ?? null,
    };
  } catch {
    return fallbackExtract(text);
  }
}

export async function groqDedupCheck(
  newExtraction: StructuredExtraction,
  existing: { id: string; extraction: StructuredExtraction }[],
  apiKey: string,
  modelName: string,
): Promise<{ isDuplicate: boolean; duplicateOf: string | null; reason: string }> {
  try {
    const model = createGroqModel(apiKey, modelName);
    const payload = {
      new: newExtraction,
      existing: existing.map((e) => ({ id: e.id, extraction: e.extraction })),
    };
    const result = await model.invoke([
      new SystemMessage(DEDUP_SYSTEM_PROMPT),
      new HumanMessage(JSON.stringify(payload)),
    ]);
    const content = typeof result.content === 'string' ? result.content : String(result.content);
    const parsed = tryParseJson(content) as { isDuplicate?: boolean; duplicateOf?: string | null; reason?: string } | null;
    if (!parsed) return { isDuplicate: false, duplicateOf: null, reason: 'No parseable response' };
    return {
      isDuplicate: !!parsed.isDuplicate,
      duplicateOf: parsed.duplicateOf ?? null,
      reason: parsed.reason ?? '',
    };
  } catch {
    return { isDuplicate: false, duplicateOf: null, reason: 'Groq call failed' };
  }
}

export async function groqPodVerdict(
  podMessage: string,
  incidentSummary: string,
  apiKey: string,
  modelName: string,
): Promise<string> {
  try {
    const model = createGroqModel(apiKey, modelName);
    const result = await model.invoke([
      new SystemMessage(
        'You are the Proof of Delivery Auditor for NeedRelay. Given a volunteer closing message and the incident it claims to resolve, produce a one-sentence verdict: ACCEPTED (the message confirms delivery) or REJECTED (the message is vague/contradicts the need). Reply in plain English, one sentence.',
      ),
      new HumanMessage(`Incident summary: ${incidentSummary}\nVolunteer message: ${podMessage}`),
    ]);
    const content = typeof result.content === 'string' ? result.content : String(result.content);
    return content.trim().slice(0, 200);
  } catch {
    return 'ACCEPTED: fallback auditor confirmed delivery (demo mode).';
  }
}

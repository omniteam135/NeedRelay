import { NextRequest, NextResponse } from 'next/server';
import { groqExtract } from '@/lib/agents/groq';
import { fallbackExtract } from '@/lib/agents/fallback';

export async function POST(req: NextRequest) {
  try {
    const { text, gps } = (await req.json()) as { text: string; gps?: { lat: number; lng: number } | null };
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY ?? '';
    const model = process.env.GROQ_MODEL ?? 'llama3-70b-8192';

    let extraction = apiKey
      ? await groqExtract(text, apiKey, model)
      : fallbackExtract(text);

    // User-supplied GPS always wins
    if (gps && typeof gps.lat === 'number' && typeof gps.lng === 'number') {
      extraction = { ...extraction, lat: gps.lat, lng: gps.lng };
    }

    return NextResponse.json({ extraction, usedLLM: !!apiKey });
  } catch {
    return NextResponse.json({ error: 'Agent 1 failed' }, { status: 500 });
  }
}

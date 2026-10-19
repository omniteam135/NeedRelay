import { NextRequest, NextResponse } from 'next/server';
import { groqDedupCheck } from '@/lib/agents/groq';
import { findDuplicateIncidents } from '@/lib/agents/fallback';
import type { StructuredExtraction } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { extraction, existing } = (await req.json()) as {
      extraction: StructuredExtraction;
      existing: { id: string; status: string; extraction: StructuredExtraction }[];
    };

    if (!extraction) {
      return NextResponse.json({ error: 'Missing extraction' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY ?? '';
    const model = process.env.GROQ_MODEL ?? 'llama3-70b-8192';

    let result: { isDuplicate: boolean; duplicateOf: string | null; reason: string };
    if (apiKey) {
      result = await groqDedupCheck(extraction, existing, apiKey, model);
    } else {
      const ids = findDuplicateIncidents(extraction, existing);
      result = {
        isDuplicate: ids.length > 0,
        duplicateOf: ids[0] ?? null,
        reason: ids.length > 0 ? 'Same landmark and district as an open incident' : 'No duplicate found',
      };
    }

    return NextResponse.json({ ...result, usedLLM: !!apiKey });
  } catch {
    return NextResponse.json({ error: 'Agent 2 failed' }, { status: 500 });
  }
}

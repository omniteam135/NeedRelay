import { NextRequest, NextResponse } from 'next/server';
import { groqPodVerdict } from '@/lib/agents/groq';

export async function POST(req: NextRequest) {
  try {
    const { podMessage, incidentSummary } = (await req.json()) as {
      podMessage: string;
      incidentSummary: string;
    };

    if (!podMessage || !incidentSummary) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY ?? '';
    const model = process.env.GROQ_MODEL ?? 'llama3-70b-8192';

    let verdict: string;
    if (apiKey) {
      verdict = await groqPodVerdict(podMessage, incidentSummary, apiKey, model);
    } else {
      const positive = /drop|deliver|success|resolv|done|complete|ration|distributed|saved|rescue|clear/i.test(podMessage);
      verdict = positive
        ? 'ACCEPTED: Volunteer confirmation indicates successful delivery.'
        : 'REJECTED: Message does not clearly confirm delivery.';
    }

    return NextResponse.json({ verdict, usedLLM: !!apiKey });
  } catch {
    return NextResponse.json({ error: 'Agent 4 failed' }, { status: 500 });
  }
}

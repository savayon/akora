import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

const MODEL = process.env.OPENROUTER_MODEL!;
const OPENROUTER_API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

function buildPrompt(proposerClaim: string, responderClaim: string) {
  return `당신은 1:1 토론의 중립적인 주제를 생성하는 역할입니다.

아래 찬성측과 반대측의 첫 주장을 바탕으로 토론 주제를 만드세요.

규칙
- 제목만 출력
- 설명, Markdown, 따옴표, 인사말 금지
- 양측 중 어느 쪽에도 치우치지 않는 표현 사용
- 15~20자 내외의 자연스러운 한국어 제목
- 가능하면 "~해야 하는가?" 형태

찬성측 주장
${proposerClaim}

반대측 주장
${responderClaim}`;
}

function normalizeTopic(value: string) {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/[*#`"_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

async function getAuthenticatedUser(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) return user;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { debateId, proposerClaim, responderClaim } = await request.json().catch(() => ({}));
  console.info(`[Debate ${debateId || 'unknown'}] topic API received`);
  if (typeof proposerClaim !== 'string' || typeof responderClaim !== 'string' || !proposerClaim.trim() || !responderClaim.trim()) {
    return NextResponse.json({ error: '양측 첫 주장이 모두 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OpenRouter API 키가 설정되지 않았습니다.' }, { status: 500 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const requestBody = {
      model: MODEL,
      messages: [{ role: 'user', content: buildPrompt(proposerClaim, responderClaim) }],
      temperature: 0.2,
      max_tokens: 80,
    };
    console.info(`[Debate ${debateId || 'unknown'}] OpenRouter request`, {
      endpoint: OPENROUTER_API_ENDPOINT,
      model: MODEL,
      requestBody,
    });
    const response = await fetch(
      OPENROUTER_API_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      },
    );

    console.info(`[Debate ${debateId || 'unknown'}] OpenRouter response received`, {
      status: response.status,
      ok: response.ok,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Debate ${debateId || 'unknown'}] OpenRouter error:`, errorText);
      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const responseText = await response.text();
    const body = JSON.parse(responseText);
    const content = body?.choices?.[0]?.message?.content;
    const topic = normalizeTopic(typeof content === 'string' ? content : '');
    if (!topic) throw new Error('OpenRouter did not return a topic.');

    return NextResponse.json({ topic });
  } catch (error) {
    console.warn(`[Debate ${debateId || 'unknown'}] OpenRouter failed:`, error instanceof Error ? error.message : error);
    return NextResponse.json({ error: '토론 주제를 생성하지 못했습니다.' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

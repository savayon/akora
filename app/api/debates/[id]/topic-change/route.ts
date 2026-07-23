import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { action, topic } = await request.json().catch(() => ({}));
  if (!['request', 'approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  if (action === 'request') {
    const normalizedTopic = typeof topic === 'string' ? topic.replace(/\s+/g, ' ').trim() : '';
    if (!normalizedTopic || normalizedTopic.length > 20) {
      return NextResponse.json({ error: '제목은 1~20자로 입력해 주세요.' }, { status: 400 });
    }
    const { data, error } = await supabase.rpc('request_debate_topic_change', {
      p_debate_id: id,
      p_new_topic: normalizedTopic,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ recipientId: data?.recipient_id });
  }

  const { error } = await supabase.rpc('resolve_debate_topic_change', {
    p_debate_id: id,
    p_approve: action === 'approve',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ success: true });
}

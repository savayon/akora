import { NextResponse } from 'next/server';
import { matchService } from '@/services/MatchService';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'request_match') {
      const result = await matchService.requestMatch(user.id, supabase);
      return NextResponse.json(result);
    } 
    
    if (action === 'heartbeat') {
      const queueStatus = await matchService.pulseHeartbeat(user.id, supabase);
      return NextResponse.json({ status: 'ok', queueStatus });
    }

    if (action === 'cancel') {
      await matchService.cancelMatch(user.id, supabase);
      return NextResponse.json({ status: 'canceled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Match API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

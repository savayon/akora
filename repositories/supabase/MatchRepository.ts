import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export interface MatchingQueue {
  id: string;
  user_id: string;
  status: 'waiting' | 'matching' | 'matched' | 'canceled' | 'timeout' | 'failed';
  matched_debate_id?: string;
  last_seen_at: string;
  created_at: string;
}

export interface RandomTopic {
  id: string;
  title: string;
  category: string;
  weight: number;
  enabled: boolean;
}

export class SupabaseMatchRepository {
  private getClient(client?: SupabaseClient) {
    return client || createClient();
  }

  // 1. 큐에 진입 (기존 대기열이 있으면 상태 업데이트, 없으면 인서트)
  async enqueueUser(userId: string, client?: SupabaseClient): Promise<MatchingQueue> {
    const supabaseClient = this.getClient(client);
    
    // 먼저 진행 중인 매칭 큐가 있는지 확인
    const { data: existing } = await supabaseClient
      .from('matching_queue')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['waiting', 'matching'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      // 기존 큐를 waiting으로 갱신
      const { data, error } = await supabaseClient
        .from('matching_queue')
        .update({ status: 'waiting', last_seen_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // 새로 생성
    const { data, error } = await supabaseClient
      .from('matching_queue')
      .insert({ user_id: userId, status: 'waiting' })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  // 2. 하트비트 갱신
  async updateHeartbeat(userId: string, client?: SupabaseClient): Promise<void> {
    const supabaseClient = this.getClient(client);
    await supabaseClient
      .from('matching_queue')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('status', ['waiting', 'matching']);
  }

  // 3. 큐 취소
  async cancelMatch(userId: string, client?: SupabaseClient): Promise<void> {
    const supabaseClient = this.getClient(client);
    await supabaseClient
      .from('matching_queue')
      .update({ status: 'canceled' })
      .eq('user_id', userId)
      .in('status', ['waiting', 'matching']);
  }

  // 4. RPC 호출을 통한 원자적 매칭 (상대방 ID 반환)
  async matchUsers(userId: string, client?: SupabaseClient): Promise<string | null> {
    const supabaseClient = this.getClient(client);
    const { data, error } = await supabaseClient.rpc('match_users', { p_user_id: userId });
    
    if (error) {
      console.error('match_users RPC Error:', error);
      return null;
    }
    
    return data; // 매칭된 opponent_id (없으면 null)
  }

  // 5. 현재 매칭 상태 확인 (Polling 용)
  async checkMatchStatus(userId: string, client?: SupabaseClient): Promise<MatchingQueue | null> {
    const supabaseClient = this.getClient(client);
    const { data, error } = await supabaseClient
      .from('matching_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) return null;
    return data;
  }

  // 6. 상태 및 토론방 ID 업데이트
  async updateMatchStatus(userId: string, status: MatchingQueue['status'], debateId?: string, client?: SupabaseClient): Promise<void> {
    const supabaseClient = this.getClient(client);
    const updateData: any = { status };
    if (debateId) updateData.matched_debate_id = debateId;

    await supabaseClient
      .from('matching_queue')
      .update(updateData)
      .eq('user_id', userId)
      .in('status', ['waiting', 'matching']);
  }

  // 7. 랜덤 주제 픽 (가중치 적용 - 인메모리 방식)
  async getRandomTopic(client?: SupabaseClient): Promise<RandomTopic | null> {
    const supabaseClient = this.getClient(client);
    const { data, error } = await supabaseClient
      .from('random_topics')
      .select('*')
      .eq('enabled', true);
      
    if (error || !data || data.length === 0) return null;
    
    // 가중치(weight) 기반 랜덤 픽
    const totalWeight = data.reduce((sum, topic) => sum + (topic.weight || 1), 0);
    let randomVal = Math.random() * totalWeight;
    
    for (const topic of data) {
      const w = topic.weight || 1;
      if (randomVal < w) return topic;
      randomVal -= w;
    }
    
    return data[0]; // fallback
  }
}

export const matchRepository = new SupabaseMatchRepository();

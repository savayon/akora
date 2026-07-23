import { createClient } from '@/utils/supabase/client';
import type { IPreVoteRepository } from '../interfaces';

export const SupabasePreVoteRepository: IPreVoteRepository = {
  async submitPreVote(debateId: string, userId: string, stance: 'proposer' | 'responder', supabaseClient?: any): Promise<void> {
    const supabase = supabaseClient || createClient();
    const { error } = await supabase
      .from('debate_votes')
      .upsert({
        debate_id: debateId,
        user_id: userId,
        vote_type: 'pre',
        stance
      }, { onConflict: 'debate_id,user_id,vote_type' });

    if (error) {
      console.error(error);
      throw new Error('사전투표 처리 실패');
    }
  },

  async getUserPreVote(debateId: string, userId: string, supabaseClient?: any): Promise<'proposer' | 'responder' | null> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debate_votes')
      .select('stance')
      .eq('debate_id', debateId)
      .eq('user_id', userId)
      .eq('vote_type', 'pre')
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data ? (data.stance as 'proposer' | 'responder') : null;
  },

  async getPreVoteStats(debateId: string, supabaseClient?: any): Promise<{ proposer: number; responder: number; total: number }> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debate_votes')
      .select('stance')
      .eq('debate_id', debateId)
      .eq('vote_type', 'pre');

    if (error || !data) {
      return { proposer: 0, responder: 0, total: 0 };
    }

    let proposerCount = 0;
    let responderCount = 0;

    data.forEach((v: any) => {
      if (v.stance === 'proposer') proposerCount++;
      else if (v.stance === 'responder') responderCount++;
    });

    return { 
      proposer: proposerCount, 
      responder: responderCount, 
      total: proposerCount + responderCount 
    };
  },

  async getAllPreVotesMap(debateId: string, supabaseClient?: any): Promise<Map<string, 'proposer' | 'responder'>> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debate_votes')
      .select('user_id, stance')
      .eq('debate_id', debateId)
      .eq('vote_type', 'pre');

    const map = new Map<string, 'proposer' | 'responder'>();
    if (error || !data) return map;

    data.forEach((row: any) => {
      map.set(row.user_id, row.stance as 'proposer' | 'responder');
    });

    return map;
  }
};

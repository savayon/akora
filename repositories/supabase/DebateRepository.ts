import { createClient } from '@/utils/supabase/client';
import type { IDebateRepository } from '../interfaces';
import type { Debate } from '@/types';

export const SupabaseDebateRepository: IDebateRepository = {
  async getDebate(debateId) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debates')
      .select(`
        *,
        proposer:users!debates_proposer_id_fkey(nickname, avatar_url),
        responder:users!debates_responder_id_fkey(nickname, avatar_url),
        turns(id)
      `)
      .eq('id', debateId)
      .single();

    if (error) {
      console.error('getDebate Error:', error.message || error);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      topic: data.topic,
      proposerId: data.proposer_id,
      responderId: data.responder_id,
      proposerName: data.proposer?.nickname || '알 수 없음',
      responderName: data.responder?.nickname || '알 수 없음',
      proposerAvatarUrl: data.proposer?.avatar_url || null,
      responderAvatarUrl: data.responder?.avatar_url || null,
      originType: data.origin_type,
      originPreview: data.origin_preview,
      originUrl: data.origin_url,
      round: Math.ceil((data.turns?.length || 0) / 2),
      status: data.status,
      createdAt: data.created_at,
    };
  },

  async getActiveDebates() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debates')
      .select(`
        *,
        proposer:users!debates_proposer_id_fkey(nickname, avatar_url),
        responder:users!debates_responder_id_fkey(nickname, avatar_url),
        turns(id)
      `)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any): Debate => ({
      id: row.id,
      topic: row.topic,
      proposerId: row.proposer_id,
      responderId: row.responder_id,
      proposerName: row.proposer?.nickname || '알 수 없음',
      responderName: row.responder?.nickname || '알 수 없음',
      proposerAvatarUrl: row.proposer?.avatar_url || null,
      responderAvatarUrl: row.responder?.avatar_url || null,
      originType: row.origin_type,
      originPreview: row.origin_preview,
      originUrl: row.origin_url,
      round: Math.ceil((row.turns?.length || 0) / 2),
      status: row.status,
      createdAt: row.created_at,
    }));
  },

  async createDebate(input) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debates')
      .insert({
        proposal_id: input.id || null,
        topic: input.topic,
        proposer_id: (input as any).proposerId,
        responder_id: (input as any).responderId,
        origin_type: input.originType || '',
        origin_preview: input.originPreview || '',
        origin_url: input.originUrl || '',
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('토론 생성 실패');
    }

    return {
      id: data.id,
      topic: data.topic,
      proposerName: input.proposerName || '',
      responderName: input.responderName || '',
      proposerAvatarUrl: null,
      responderAvatarUrl: null,
      originType: data.origin_type,
      originPreview: data.origin_preview,
      originUrl: data.origin_url,
      round: 0,
      status: data.status,
    };
  },

  async updateStatus(debateId, status) {
    const supabase = createClient();
    const { error } = await supabase.from('debates').update({ status }).eq('id', debateId);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async submitVote(debateId: string, userId: string, stance: 'proposer' | 'responder') {
    const supabase = createClient();
    const { error } = await supabase
      .from('debate_votes')
      .insert({
        debate_id: debateId,
        user_id: userId,
        stance
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('이미 투표하셨습니다.');
      }
      {
        console.error(error);
        throw new Error('투표 실패');
      }
    }
  },

  async getVoteStats(debateId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debate_votes')
      .select('stance')
      .eq('debate_id', debateId);

    if (error || !data) return { proposer: 0, responder: 0 };
    
    return {
      proposer: data.filter(v => v.stance === 'proposer').length,
      responder: data.filter(v => v.stance === 'responder').length,
    };
  },

  async getUserVote(debateId: string, userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debate_votes')
      .select('stance')
      .eq('debate_id', debateId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.stance as 'proposer' | 'responder';
  },

  async getDebateByProposalId(proposalId: string | number) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debates')
      .select('id')
      .eq('proposal_id', proposalId)
      .single();
    
    if (error || !data) return null;
    return { id: data.id } as Debate;
  }
};

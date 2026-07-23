import { createClient } from '@/utils/supabase/client';
import type { IDebateRepository } from '../interfaces';
import type { Debate } from '@/types';

export const SupabaseDebateRepository: IDebateRepository = {
  async getDebate(debateId, supabaseClient) {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debates')
      .select(`
        *,
        proposer:users!debates_proposer_id_fkey(nickname, avatar_url),
        responder:users!debates_responder_id_fkey(nickname, avatar_url),
        turns(id, created_at, author_role)
      `)
      .eq('id', debateId)
      .single();

    if (error) {
      console.error('getDebate Error:', error.message || error);
      return null;
    }
    if (!data) return null;

    // 서버 측(또는 조회 시점) 시간패 검증 로직
    let computedStatus = data.status;
    let computedEndedReason = data.ended_reason;
    let computedTimeoutLoserRole = data.timeout_loser_role;

    if (computedStatus === 'in_progress') {
      const lastTurn = data.turns && data.turns.length > 0 ? data.turns[data.turns.length - 1] : null;
      let lastTime = new Date(data.created_at).getTime();
      let currentTurnOwner: 'proposer' | 'responder' = 'proposer';
      
      if (lastTurn && lastTurn.created_at) {
        lastTime = new Date(lastTurn.created_at).getTime();
        currentTurnOwner = lastTurn.author_role === 'proposer' ? 'responder' : 'proposer';
      }

      // 12시간 (ms)
      const TIMEOUT_MS = 12 * 60 * 60 * 1000;
      if (Date.now() - lastTime > TIMEOUT_MS) {
        computedStatus = 'voting';
        computedEndedReason = 'timeout';
        computedTimeoutLoserRole = currentTurnOwner;
        
        // 백그라운드에서 DB 업데이트 시도
        SupabaseDebateRepository.markAsTimeoutLoss(debateId, currentTurnOwner).catch(() => {});
      }
    }

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
      round: Math.floor((data.turns?.length || 0) / 2) + 1,
      status: data.status === 'voting' ? 'judging' : data.status,
      endedReason: data.ended_reason,
      timeoutLoserRole: data.timeout_loser_role,
      proposerClaim: data.proposer_claim,
      responderClaim: data.responder_claim,
      topicStatus: data.topic_status,
      proposerTopicEditCount: data.proposer_topic_edit_count || 0,
      responderTopicEditCount: data.responder_topic_edit_count || 0,
      pendingTopic: data.pending_topic,
      topicChangeRequesterId: data.topic_change_requester_id,
      spectatorCount: data.spectator_count || 0,
      winnerId: data.winner_id,
      createdAt: data.created_at,
      judgingEndsAt: data.judging_ends_at || null,
    };
  },

  async getActiveDebates(supabaseClient) {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debates')
      .select(`
        *,
        proposer:users!debates_proposer_id_fkey(nickname, avatar_url),
        responder:users!debates_responder_id_fkey(nickname, avatar_url),
        turns(id),
        debate_votes(user_id)
      `)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const validData = data.filter((row: any) => row.ended_reason !== 'forfeit' && row.ended_reason !== 'abandoned');

    return validData.map((row: any): Debate => ({
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
      round: Math.floor((row.turns?.length || 0) / 2) + 1,
      status: row.status === 'voting' ? 'judging' : row.status,
      proposerClaim: row.proposer_claim,
      responderClaim: row.responder_claim,
      topicStatus: row.topic_status,
      proposerTopicEditCount: row.proposer_topic_edit_count || 0,
      responderTopicEditCount: row.responder_topic_edit_count || 0,
      spectatorCount: new Set((row.debate_votes || []).map((vote: any) => vote.user_id)).size,
      createdAt: row.created_at,
      judgingEndsAt: row.judging_ends_at || null,
    }));
  },

  async getRecentDebates(limit, supabaseClient?) {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debates')
      .select(`
        *,
        proposer:users!debates_proposer_id_fkey(nickname, avatar_url),
        responder:users!debates_responder_id_fkey(nickname, avatar_url),
        turns(id),
        debate_votes(user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Fetch more to account for local filtering

    if (error || !data) return [];

    const validData = data.filter((row: any) => row.ended_reason !== 'forfeit' && row.ended_reason !== 'abandoned');

    return validData.slice(0, limit).map((row: any): Debate => ({
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
      round: Math.floor((row.turns?.length || 0) / 2) + 1,
      status: row.status === 'voting' ? 'judging' : row.status,
      proposerClaim: row.proposer_claim,
      responderClaim: row.responder_claim,
      topicStatus: row.topic_status,
      proposerTopicEditCount: row.proposer_topic_edit_count || 0,
      responderTopicEditCount: row.responder_topic_edit_count || 0,
      spectatorCount: new Set((row.debate_votes || []).map((vote: any) => vote.user_id)).size,
      createdAt: row.created_at,
      judgingEndsAt: row.judging_ends_at || null,
    }));
  },

  async createDebate(input, supabaseClient) {
    const supabase = supabaseClient || createClient();
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
        proposer_claim: (input as any).proposerClaim || null,
        responder_claim: (input as any).responderClaim || null,
        status: (input as any).status || 'preparing',
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
      proposerClaim: data.proposer_claim,
      responderClaim: data.responder_claim,
      judgingEndsAt: data.judging_ends_at || null,
    };
  },

  async updateStatus(debateId, status, supabaseClient) {
    const supabase = supabaseClient || createClient();
    const { error } = await supabase.from('debates').update({ status }).eq('id', debateId);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },


  async getDebateByProposalId(proposalId: string | number, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('debates')
      .select('id')
      .eq('proposal_id', proposalId)
      .single();
    
    if (error || !data) return null;
    return { id: data.id } as Debate;
  },

  async markAsTimeoutLoss(debateId: string, loserRole: 'proposer' | 'responder', supabaseClient?: any): Promise<boolean> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase.rpc('timeout_debate', {
      p_debate_id: debateId
    });

    if (error) {
      console.error('markAsTimeoutLoss RPC error:', error.message, error.details, error.hint, error);
      return false;
    }

    return !!data;
  },

  async submitClaim(debateId: string, role: 'proposer' | 'responder', claim: string, supabaseClient?: any): Promise<void> {
    const supabase = supabaseClient || createClient();
    const updatePayload: any = {};
    if (role === 'proposer') updatePayload.proposer_claim = claim;
    else updatePayload.responder_claim = claim;

    const { error } = await supabase
      .from('debates')
      .update(updatePayload)
      .eq('id', debateId);

    if (error) {
      console.error('submitClaim error:', error);
      throw new Error('주장 제출에 실패했습니다.');
    }
  },

  async markAsForfeitLoss(debateId: string, role: 'proposer' | 'responder' | 'both', supabaseClient?: any): Promise<boolean> {
    const supabase = supabaseClient || createClient();
    
    // If both forfeit, timeout_loser_role can be null, but ended_reason is forfeit
    const timeoutLoserRole = role === 'both' ? null : role;

    const { data, error } = await supabase
      .from('debates')
      .update({
        status: 'completed',
        ended_reason: 'forfeit',
        timeout_loser_role: timeoutLoserRole
      })
      .eq('id', debateId)
      .eq('status', 'preparing')
      .select('id');

    if (error) {
      console.error('markAsForfeitLoss error:', error);
      return false;
    }
    return data && data.length > 0;
  },

  async endDebate(debateId: string, supabaseClient?: any): Promise<boolean> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase.from('debates').update({ status: 'completed' }).eq('id', debateId).select('id');
    return !error && data && data.length > 0;
  },
  async generateDebateTopic(debateId: string, proposerClaim: string, responderClaim: string, supabaseClient?: any): Promise<{ topic: string } | null> {
    // Basic stub, real implementation would call LLM API
    return { topic: '생성된 토론 주제' };
  },
  async updateDebateTopic(debateId: string, topic: string, supabaseClient?: any): Promise<void> {
    const supabase = supabaseClient || createClient();
    await supabase.from('debates').update({ topic }).eq('id', debateId);
  },
  async requestTopicChange(debateId: string, topic: string, supabaseClient?: any): Promise<{ recipientId: string }> {
    return { recipientId: '' };
  },
  async approveTopicChange(debateId: string, supabaseClient?: any): Promise<void> {
    return;
  },
  async rejectTopicChange(debateId: string, supabaseClient?: any): Promise<void> {
    return;
  },
  getDisplayTopic(debate: Pick<Debate, 'topic' | 'topicStatus'>): string {
    return debate.topic;
  },
  async getDebateStatsData(userId: string, supabaseClient?: any): Promise<any> {
    return { totalDebates: 0, wins: 0, losses: 0, winRate: 0, rank: 'Bronze' };
  },
  async closeDebateWithResult(debateId: string, winnerId: string, supabaseClient?: any): Promise<boolean> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase.from('debates').update({ status: 'completed', winner_id: winnerId }).eq('id', debateId).select('id');
    return !error && data && data.length > 0;
  },
  async getDebateNotificationRecipients(debateId: string, supabaseClient?: any): Promise<string[]> {
    return [];
  }
};

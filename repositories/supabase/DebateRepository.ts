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
      round: Math.ceil((data.turns?.length || 0) / 2),
      status: computedStatus,
      endedReason: computedEndedReason,
      timeoutLoserRole: computedTimeoutLoserRole,
      proposerClaim: data.proposer_claim,
      responderClaim: data.responder_claim,
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
      round: Math.ceil((row.turns?.length || 0) / 2),
      status: row.status,
      proposerClaim: row.proposer_claim,
      responderClaim: row.responder_claim,
      createdAt: row.created_at,
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
        turns(id)
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
      round: Math.ceil((row.turns?.length || 0) / 2),
      status: row.status,
      proposerClaim: row.proposer_claim,
      responderClaim: row.responder_claim,
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

  async submitVote(debateId: string, userId: string, stance: 'proposer' | 'responder', voteType: 'pre' | 'final') {
    const supabase = createClient();
    const { error } = await supabase
      .from('debate_votes')
      .upsert({
        debate_id: debateId,
        user_id: userId,
        vote_type: voteType,
        stance
      }, { onConflict: 'debate_id,user_id,vote_type' }); // Upsert to allow changing vote if needed, or simply handle it gracefully

    if (error) {
      console.error(error);
      throw new Error('투표 실패');
    }
    
    // 만약 이것이 final vote이고, pre vote와 다르다면 설득왕 카운트를 올려줘야 하는지 체크
    // 여기서 바로 올릴 수도 있고, 나중에 배치나 투표 결과 화면에서 한꺼번에 계산해서 올려줄 수도 있음.
    // 안전하게 하려면 여기서 DB 함수나 트리거를 사용하거나 추가 쿼리를 날릴 수 있지만, 복잡도를 낮추기 위해 나중에 계산
  },

  async getVoteStats(debateId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debate_votes')
      .select('user_id, stance, vote_type')
      .eq('debate_id', debateId);

    if (error || !data) return { proposer: 0, responder: 0, proposerPersuaded: 0, responderPersuaded: 0 };
    
    const preVotes = new Map<string, string>();
    const finalVotes = new Map<string, string>();
    
    data.forEach(v => {
      if (v.vote_type === 'pre') preVotes.set(v.user_id, v.stance);
      else finalVotes.set(v.user_id, v.stance);
    });
    
    let proposerPersuaded = 0;
    let responderPersuaded = 0;
    let proposer = 0;
    let responder = 0;
    
    finalVotes.forEach((stance, userId) => {
      if (stance === 'proposer') proposer++;
      else if (stance === 'responder') responder++;
      
      const preStance = preVotes.get(userId);
      if (preStance && preStance !== stance) {
        if (stance === 'proposer') proposerPersuaded++;
        else if (stance === 'responder') responderPersuaded++;
      }
    });
    
    return {
      proposer,
      responder,
      proposerPersuaded,
      responderPersuaded
    };
  },

  async getUserVote(debateId: string, userId: string, voteType: 'pre' | 'final') {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debate_votes')
      .select('stance')
      .eq('debate_id', debateId)
      .eq('user_id', userId)
      .eq('vote_type', voteType)
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
  },

  async markAsTimeoutLoss(debateId: string, loserRole: 'proposer' | 'responder'): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debates')
      .update({
        status: 'voting',
        ended_reason: 'timeout',
        timeout_loser_role: loserRole
      })
      .eq('id', debateId)
      .eq('status', 'in_progress')
      .select('id');

    if (error) {
      console.error('markAsTimeoutLoss error:', error);
      return false;
    }

    return data && data.length > 0;
  },

  async submitClaim(debateId: string, role: 'proposer' | 'responder', claim: string): Promise<void> {
    const supabase = createClient();
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

  async markAsForfeitLoss(debateId: string, role: 'proposer' | 'responder' | 'both'): Promise<boolean> {
    const supabase = createClient();
    
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
  }
};

import { createClient } from '@/utils/supabase/client';
import type { IProposalRepository } from '../interfaces';
import type { Proposal } from '@/types';

export const SupabaseProposalRepository: IProposalRepository = {
  async createProposal(data) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // targetName으로 target user 조회
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', data.targetName)
      .single();

    const { data: row, error } = await supabase
      .from('proposals')
      .insert({
        proposer_id: user.id,
        target_id: data.targetId || targetUser?.id || user.id,
        source_type: data.sourceType || 'comment',
        source_id: data.sourceId,
        topic: data.topic || '',
        claim: data.claim || '',
        excerpt: data.excerpt || '',
      })
      .select('*, proposer:users!proposals_proposer_id_fkey(nickname), target:users!proposals_target_id_fkey(nickname)')
      .single();

    if (error || !row) {
      console.error(error);
      throw new Error('제안 생성 실패');
    }

    return {
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      proposerName: row.proposer?.nickname || '사용자',
      targetName: row.target?.nickname || '',
      topic: row.topic,
      claim: row.claim,
      excerpt: row.excerpt,
      status: row.status,
      createdAt: row.created_at,
    };
  },

  async getPendingProposals(userId) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('proposals')
      .select('*, proposer:users!proposals_proposer_id_fkey(nickname), target:users!proposals_target_id_fkey(nickname)')
      .eq('target_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any): Proposal => ({
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      proposerName: row.proposer?.nickname || '알 수 없음',
      targetName: row.target?.nickname || '',
      topic: row.topic,
      claim: row.claim,
      excerpt: row.excerpt,
      status: row.status,
      createdAt: row.created_at,
    }));
  },

  async getProposal(id) {
    if (!id || id === 'undefined') return null;
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from('proposals')
      .select('*, proposer:users!proposals_proposer_id_fkey(nickname), target:users!proposals_target_id_fkey(nickname)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getProposal Error:', error);
      return null;
    }
    if (!row) return null;
    let postId = undefined;
    if (row.source_type === 'comment') {
      const { data: commentData } = await supabase.from('comments').select('post_id').eq('id', row.source_id).single();
      if (commentData) {
        postId = commentData.post_id;
      }
    } else {
      postId = row.source_id; // For posts, the sourceId is the postId
    }

    return {
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      postId,
      proposerId: row.proposer_id,
      targetId: row.target_id,
      proposerName: row.proposer?.nickname || '사용자',
      targetName: row.target?.nickname || '',
      topic: row.topic,
      claim: row.claim,
      excerpt: row.excerpt,
      status: row.status,
      createdAt: row.created_at,
    };
  },

  async updateStatus(id, status) {
    const supabase = createClient();
    const { error } = await supabase.from('proposals').update({ status }).eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async toggleWatchProposal(proposalId, userId) {
    const supabase = createClient();
    
    // Check if already watched
    const { data: existing, error: existingError } = await supabase
      .from('proposal_watches')
      .select('id')
      .eq('proposal_id', proposalId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      // Remove watch
      const { error } = await supabase.from('proposal_watches').delete().eq('id', existing.id);
      if (error) throw error;
    } else {
      // Add watch
      const { error } = await supabase.from('proposal_watches').insert({
        proposal_id: proposalId,
        user_id: userId
      });
      if (error) throw error;
    }

    // Get new count
    return await this.getWatchStatus(proposalId, userId);
  },

  async getWatchStatus(proposalId, userId) {
    const supabase = createClient();
    
    const { count, error: countError } = await supabase
      .from('proposal_watches')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposalId);

    if (countError) {
      throw countError;
    }

    let isWatched = false;
    if (userId) {
      const { data, error } = await supabase
        .from('proposal_watches')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      
      if (data) {
        isWatched = true;
      }
    }

    return {
      isWatched,
      watchCount: count || 0
    };
  },

  async migrateWatchersToFollowers(proposalId: string | number, debateId: string): Promise<string[]> {
    const supabase = createClient();
    const { data: watchers } = await supabase
      .from('proposal_watches')
      .select('user_id')
      .eq('proposal_id', proposalId);
    
    if (!watchers || watchers.length === 0) return [];

    const followersData = watchers.map(w => ({
      debate_id: debateId,
      user_id: w.user_id
    }));
    await supabase.from('debate_followers').insert(followersData);
    
    return watchers.map(w => w.user_id);
  }
};

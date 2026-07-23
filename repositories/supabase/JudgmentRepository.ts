import { createClient } from '@/utils/supabase/client';
import type { IJudgmentRepository } from '../interfaces';
import type { Judgment, JurorType } from '@/types';

export const SupabaseJudgmentRepository: IJudgmentRepository = {
  async submitJudgment(
    debateId: string, 
    jurorId: string | null, 
    jurorType: JurorType, 
    votedForId: string, 
    reason: string,
    supabaseClient?: any
  ): Promise<boolean> {
    const supabase = supabaseClient || createClient();
    
    // 1. Check if user already judged (if human)
    if (jurorType === 'human' && jurorId) {
      const hasJudged = await this.hasUserJudged(debateId, jurorId);
      if (hasJudged) {
        throw new Error('이미 이 토론에 판정을 제출하셨습니다.');
      }
    }

    const { error } = await supabase
      .from('judgments')
      .insert({
        debate_id: debateId,
        juror_id: jurorId,
        juror_type: jurorType,
        voted_for_id: votedForId,
        reason
      });

    if (error) {
      console.error('submitJudgment error:', error);
      return false;
    }
    return true;
  },

  async getJudgments(debateId: string, supabaseClient?: any): Promise<{
    judgments: Judgment[];
    currentCount: number;
    requiredCount: number;
  }> {
    const supabase = supabaseClient || createClient();
    
    // 1. Get debate required jurors
    const { data: debate, error: debateError } = await supabase
      .from('debates')
      .select('required_jurors')
      .eq('id', debateId)
      .single();
      
    if (debateError) {
      console.error('getJudgments debate error:', debateError);
      return { judgments: [], currentCount: 0, requiredCount: 5 };
    }
    
    const requiredCount = debate.required_jurors || 5;

    // 2. Get judgments
    const { data, error } = await supabase
      .from('judgments')
      .select('*')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getJudgments error:', error);
      return { judgments: [], currentCount: 0, requiredCount };
    }

    const judgments = data.map((row: any) => ({
      id: row.id,
      debateId: row.debate_id,
      jurorId: row.juror_id,
      jurorType: row.juror_type,
      votedForId: row.voted_for_id,
      reason: row.reason,
      createdAt: row.created_at
    }));

    return {
      judgments,
      currentCount: judgments.length,
      requiredCount
    };
  },
  
  async hasUserJudged(debateId: string, userId: string, supabaseClient?: any): Promise<boolean> {
    const supabase = supabaseClient || createClient();
    const { count, error } = await supabase
      .from('judgments')
      .select('*', { count: 'exact', head: true })
      .eq('debate_id', debateId)
      .eq('juror_id', userId);
      
    if (error) {
      console.error('hasUserJudged error:', error);
      return false;
    }
    return count !== null && count > 0;
  }
};

import { createClient } from '@/utils/supabase/client';
import type { ITurnRepository } from '../interfaces';
import type { Turn } from '@/types';
import { formatTime } from '@/lib/formatTime';

export const SupabaseTurnRepository: ITurnRepository = {
  async getTurns(debateId) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('turns')
      .select(`
        *,
        author:users(nickname, avatar_url),
        quoted_turn:turns(
          turn_num,
          author:users(nickname)
        )
      `)
      .eq('debate_id', debateId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((row: any): Turn => ({
      id: row.id,
      turnNum: row.turn_num,
      authorRole: row.author_role,
      authorName: row.author?.nickname || '알 수 없음',
      authorAvatarUrl: row.author?.avatar_url || null,
      content: row.content,
      time: formatTime(row.created_at),
      quotedTurnId: row.quoted_turn_id || undefined,
      quotedExcerpt: row.quoted_excerpt || undefined,
      quotedAuthorName: row.quoted_turn?.author?.nickname || undefined,
      quotedTurnNum: row.quoted_turn?.turn_num || undefined,
      createdAt: row.created_at,
    }));
  },

  async addTurn(debateId, turnData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('turns')
      .insert({
        debate_id: debateId,
        author_id: user.id,
        author_role: turnData.authorRole,
        turn_num: turnData.turnNum,
        content: turnData.content,
        quoted_turn_id: turnData.quotedTurnId || null,
        quoted_excerpt: turnData.quotedExcerpt || null,
      })
      .select('*, author:users(nickname, avatar_url)')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('발언 등록 실패');
    }

    return {
      id: data.id,
      turnNum: data.turn_num,
      authorRole: data.author_role,
      authorName: data.author?.nickname || '알 수 없음',
      authorAvatarUrl: data.author?.avatar_url || null,
      content: data.content,
      time: formatTime(data.created_at),
      quotedTurnId: data.quoted_turn_id || undefined,
      quotedExcerpt: data.quoted_excerpt || undefined,
      createdAt: data.created_at,
    };
  },
};

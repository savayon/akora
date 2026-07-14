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

    const { data: rpcData, error: rpcError } = await supabase.rpc('add_turn_safely', {
      p_debate_id: debateId,
      p_author_id: user.id,
      p_author_role: turnData.authorRole,
      p_turn_num: turnData.turnNum,
      p_content: turnData.content,
      p_quoted_turn_id: turnData.quotedTurnId || null,
      p_quoted_excerpt: turnData.quotedExcerpt || null
    });

    if (rpcError) {
      console.error(rpcError);
      throw new Error(rpcError.message.includes('Time limit exceeded') ? '답변 기한이 만료되어 발언을 등록할 수 없습니다.' : '발언 등록 실패: ' + rpcError.message);
    }

    // RPC가 반환한 새로 생성된 턴 데이터
    const newTurn = rpcData as any;

    // 조인된 작성자 정보를 가져오기 위해 다시 한 번 조회합니다.
    const { data: fullData, error: selectError } = await supabase
      .from('turns')
      .select('*, author:users(nickname, avatar_url)')
      .eq('id', newTurn.id)
      .single();

    if (selectError || !fullData) {
      console.error(selectError);
      throw new Error('발언 등록은 성공했으나 데이터를 불러오는 데 실패했습니다.');
    }

    const data = fullData;

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

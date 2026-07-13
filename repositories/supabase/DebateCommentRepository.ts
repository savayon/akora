import { createClient } from '@/utils/supabase/client';
import type { Comment } from '@/types';
import { formatRelativeTime } from '@/lib/formatTime';

export const debateCommentRepository = {
  async getComments(debateId: string): Promise<Comment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debate_comments')
      .select('*, author:users(nickname, avatar_url)')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any): Comment => ({
      id: row.id,
      author: row.author?.nickname || '알 수 없음',
      authorId: row.author_id,
      authorAvatarUrl: row.author?.avatar_url || null,
      content: row.content,
      likes: row.likes_count || 0,
      createdAt: formatRelativeTime(row.created_at),
    }));
  },

  async createComment(debateId: string, authorId: string, content: string): Promise<Comment> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debate_comments')
      .insert({
        debate_id: debateId,
        author_id: authorId,
        content,
      })
      .select('*, author:users(nickname, avatar_url)')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('Failed to create debate comment');
    }

    return {
      id: data.id,
      author: data.author?.nickname || '알 수 없음',
      authorId: data.author_id,
      authorAvatarUrl: data.author?.avatar_url || null,
      content: data.content,
      likes: data.likes_count || 0,
      createdAt: formatRelativeTime(data.created_at),
    };
  },

  async toggleLike(commentId: string, userId: string): Promise<boolean> {
    const supabase = createClient();
    
    // 이미 추천했는지 확인
    const { data: existing } = await supabase
      .from('debate_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // 추천 취소 (트리거가 자동 감소)
      await supabase
        .from('debate_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      return false; // unliked
    } else {
      // 추천 등록 (트리거가 자동 증가)
      await supabase
        .from('debate_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        });
      return true; // liked
    }
  }
};

import { createClient } from '@/utils/supabase/client';
import type { ICommentRepository } from '../interfaces';
import type { BoardComment, Comment } from '@/types';
import { formatRelativeTime } from '@/lib/formatTime';

/**
 * DB의 플랫 댓글 목록을 트리 구조(BoardComment[])로 변환합니다.
 */
function buildCommentTree(rows: any[]): BoardComment[] {
  const map = new Map<string, BoardComment>();
  const roots: BoardComment[] = [];

  // 1차: 모든 댓글을 맵에 등록
  for (const row of rows) {
    const comment: BoardComment = {
      id: row.id,
      author: row.users?.nickname || '알 수 없음',
      authorAvatarUrl: row.users?.avatar_url || null,
      authorId: row.author_id,
      content: row.content,
      likes: row.likes_count,
      createdAt: formatRelativeTime(row.created_at),
      deletedAt: row.deleted_at,
      deletedReason: row.deleted_reason,
      replyType: row.reply_type || 'normal',
      targetUserName: row.target_user?.nickname,
      targetUserId: row.target_user_id,
      hasDebate: row.hasDebate || false,
      debateStatus: row.debateStatus || 'none',
      debateId: row.debateId,
      proposalId: row.proposalId,
      replies: [],
    };
    map.set(row.id, comment);
  }

  // 2차: 트리 구성
  for (const row of rows) {
    const comment = map.get(row.id)!;
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.replies!.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

export const SupabaseCommentRepository: ICommentRepository = {
  async getBoardComments(postId) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, content, likes_count, reply_type, parent_id, target_user_id, created_at,
        author_id, deleted_at, deleted_reason,
        users!comments_author_id_fkey(nickname, avatar_url),
        target_user:users!comments_target_user_id_fkey(nickname, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    // 제안 댓글들의 ID 수집
    const proposalCommentIds = data.filter(c => c.reply_type === 'proposal').map(c => c.id);
    
    let proposalsMap = new Map();
    if (proposalCommentIds.length > 0) {
      // 제안 상태와 연결된 토론 ID 조회
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select(`
          id, status, source_id, target_id,
          target:users!proposals_target_id_fkey(nickname),
          debates (id)
        `)
        .in('source_id', proposalCommentIds);
        
      if (proposalsData) {
        proposalsData.forEach(p => {
          proposalsMap.set(p.source_id, p);
        });
      }
    }

    const rows = data.map(row => {
      let hasDebate = false;
      let debateStatus = 'none';
      let debateId;
      let proposalId;
      let p;

      if (row.reply_type === 'proposal' && proposalsMap.has(row.id)) {
        p = proposalsMap.get(row.id);
        hasDebate = true;
        proposalId = p.id;
        if (p.status === 'accepted' && p.debates) {
          const debateObj = Array.isArray(p.debates) ? p.debates[0] : p.debates;
          if (debateObj) {
            debateStatus = 'active';
            debateId = debateObj.id;
          }
        } else if (p.status === 'pending') {
          debateStatus = 'pending';
        } else if (p.status === 'rejected') {
          debateStatus = 'rejected';
        } else if (p.status === 'expired') {
          debateStatus = 'expired';
        }
      }

      return {
        ...row,
        target_user_id: row.target_user_id || p?.target_id,
        target_user: {
          nickname: (Array.isArray(row.target_user) ? row.target_user[0]?.nickname : (row.target_user as any)?.nickname) || (Array.isArray(p?.target) ? p?.target[0]?.nickname : p?.target?.nickname)
        },
        hasDebate,
        debateStatus,
        debateId,
        proposalId,
      };
    });

    return buildCommentTree(rows);
  },

  async createComment(postId, content, parentId, replyType, targetUserId) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const insertData: any = {
      post_id: postId,
      author_id: user.id,
      content,
    };
    if (parentId) insertData.parent_id = parentId;
    if (replyType) insertData.reply_type = replyType;
    if (targetUserId) insertData.target_user_id = targetUserId;

    const { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select('id, content, likes_count, created_at, author_id, users!comments_author_id_fkey(nickname, avatar_url)')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('댓글 작성 실패');
    }

    // 게시글 comments_count 증가
    await supabase.rpc('increment_comment_count', { p_post_id: postId });

    return {
      id: data.id,
      author: (Array.isArray(data.users) ? data.users[0]?.nickname : (data.users as any)?.nickname) || '사용자',
      authorId: data.author_id,
      authorAvatarUrl: (Array.isArray(data.users) ? data.users[0]?.avatar_url : (data.users as any)?.avatar_url) || null,
      content: data.content,
      likes: data.likes_count,
      createdAt: '방금 전',
      replyType: replyType || 'normal',
      hasDebate: false,
      debateStatus: 'none',
      replies: [],
    } as any;
  },

  async deleteComment(id) {
    const supabase = createClient();
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async softDeleteComment(id, reason) {
    const supabase = createClient();
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString(), deleted_reason: reason })
      .eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async toggleLike(commentId: string, userId: string): Promise<boolean> {
    const supabase = createClient();
    
    // Check if already liked
    const { data: existing, error: existingError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing) {
      // Remove like
      const { error } = await supabase.from('comment_likes').delete().eq('id', existing.id);
      if (error) throw new Error(error.message);
      return false;
    } else {
      // Add like
      const { error } = await supabase.from('comment_likes').insert({
        comment_id: commentId,
        user_id: userId
      });
      if (error) throw new Error(error.message);
      return true;
    }
  },
};

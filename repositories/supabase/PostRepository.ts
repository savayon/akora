import { createClient } from '@/utils/supabase/client';
import type { IPostRepository } from '../interfaces';
import type { PostListItem } from '@/types';
import { mapToPostListItem, mapToPostDetail } from '@/lib/mappers';

export const SupabasePostRepository: IPostRepository = {
  async getPosts(boardType, client?) {
    const supabase = client || createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, views_count, likes_count, comments_count, has_active_debates, created_at, author_id, deleted_at, deleted_reason, users!posts_author_id_fkey(nickname, avatar_url)')
      .eq('board_type', boardType)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(mapToPostListItem);
  },

  async getRecentPosts(boardType, limit, client?) {
    const supabase = client || createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, views_count, likes_count, comments_count, has_active_debates, created_at, author_id, deleted_at, deleted_reason, users!posts_author_id_fkey(nickname, avatar_url)')
      .eq('board_type', boardType)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(mapToPostListItem);
  },

  async getPost(id, client?) {
    const supabase = client || createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*, users!posts_author_id_fkey(nickname, avatar_url)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return mapToPostDetail(data);
  },

  async createPost(input, client?) {
    const supabase = client || createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        board_type: input.board_type,
        author_id: user.id,
        title: input.title,
        content: input.content,
      })
      .select('*, users!posts_author_id_fkey(nickname, avatar_url)')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('게시글 작성 실패');
    }

    return mapToPostDetail(data);
  },

  async deletePost(id, client?) {
    const supabase = client || createClient();
    
    // 외래키 설정 때문에 자식 레코드들이 CASCADE 되거나 SET NULL 처리됨.
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async softDeletePost(id, reason, client?) {
    const supabase = client || createClient();
    const { error } = await supabase
      .from('posts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_reason: reason
      })
      .eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async incrementViews(id, client?) {
    const supabase = client || createClient();
    
    // 1. 현재 조회수 가져오기
    const { error } = await supabase.rpc('increment_views', { post_id: id });
    if (error) {
      console.warn('Failed to increment views via RPC, fallback not implemented', error);
    }
  },

  async getPostLikeStatus(postId: string, userId: string): Promise<boolean> {
    if (!userId) return false;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return !!data;
  },

  async togglePostLike(postId: string, userId: string): Promise<boolean> {
    const supabase = createClient();
    
    // Check if already liked
    const { data: existing, error: existingError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing) {
      // Remove like
      const { error } = await supabase.from('post_likes').delete().eq('id', existing.id);
      if (error) throw new Error(error.message);
      return false;
    } else {
      // Add like
      const { error } = await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: userId
      });
      if (error) throw new Error(error.message);
      return true;
    }
  },
};

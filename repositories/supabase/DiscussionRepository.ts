import { createClient } from '@/utils/supabase/client';
import type { IDiscussionRepository } from '../interfaces';
import type { DiscussionTopic, DiscussionComment } from '@/types';
import { mapToDiscussionTopic, mapToDiscussionComment } from '@/lib/mappers';

export const SupabaseDiscussionRepository: IDiscussionRepository = {
  async getTopics(client?) {
    const supabase = client || createClient();
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('*, users!discussion_topics_author_fkey(nickname, avatar_url), discussion_votes(stance)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(mapToDiscussionTopic);
  },

  async getTopic(id) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('discussion_topics')
      .select('*, users!discussion_topics_author_fkey(nickname, avatar_url), discussion_votes(stance)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return mapToDiscussionTopic(data);
  },

  async getComments(topicId) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('discussion_comments')
      .select('*, users!discussion_comments_author_fkey(nickname, avatar_url)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map(mapToDiscussionComment);
  },

  async createTopic(input) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('discussion_topics')
      .insert({
        author_id: user.id,
        title: input.title,
        stance_a: input.stanceA,
        stance_b: input.stanceB,
      })
      .select('*, users!discussion_topics_author_fkey(nickname, avatar_url)')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('논제 작성 실패');
    }

    return mapToDiscussionTopic(data);
  },

  async createComment(topicId, input) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('discussion_comments')
      .insert({
        topic_id: topicId,
        author_id: user.id,
        content: input.content,
        stance: input.stance,
      })
      .select('*, users!discussion_comments_author_fkey(nickname, avatar_url)')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('의견 작성 실패');
    }

    return mapToDiscussionComment(data);
  },

  async vote(topicId, stance) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // UPSERT: 중복 투표 방지. 진영 변경 시 기존 투표 교체.
    const { data: existing } = await supabase
      .from('discussion_votes')
      .select('id, stance')
      .eq('topic_id', topicId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      if (existing.stance === stance) return; // 같은 진영 재투표
      // 진영 변경 (단순 업데이트)
      await supabase.from('discussion_votes').update({ stance }).eq('id', existing.id);
    } else {
      // 새 투표
      await supabase.from('discussion_votes').insert({ topic_id: topicId, user_id: user.id, stance });
    }
  },

  async getUserVote(topicId) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('discussion_votes')
      .select('stance')
      .eq('topic_id', topicId)
      .eq('user_id', user.id)
      .single();

    return data ? data.stance : null;
  },

  async deleteUserComments(topicId) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('discussion_comments')
      .delete()
      .eq('topic_id', topicId)
      .eq('author_id', user.id);
  },

  async deleteTopic(id) {
    const supabase = createClient();
    const { error } = await supabase.from('discussion_topics').delete().eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async softDeleteTopic(id, reason) {
    const supabase = createClient();
    const { error } = await supabase
      .from('discussion_topics')
      .update({ deleted_at: new Date().toISOString(), deleted_reason: reason })
      .eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async softDeleteDiscussionComment(id, reason) {
    const supabase = createClient();
    const { error } = await supabase
      .from('discussion_comments')
      .update({ deleted_at: new Date().toISOString(), deleted_reason: reason })
      .eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },
};

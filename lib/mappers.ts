import { formatRelativeTime } from './formatTime';
import type { PostListItem, Post, DiscussionTopic, DiscussionComment } from '@/types';

export function mapToPostListItem(row: any): PostListItem {
  return {
    id: row.id,
    title: row.title,
    author: row.users?.nickname || '알 수 없음',
    authorAvatarUrl: row.users?.avatar_url || null,
    authorId: row.author_id,
    date: formatRelativeTime(row.created_at),
    views: row.views_count,
    likes: row.likes_count,
    comments: row.comments_count,
    isDebating: row.has_active_debates,
    deletedAt: row.deleted_at,
  };
}

export function mapToPostDetail(data: any): Post {
  return {
    id: data.id,
    board_type: data.board_type,
    author_id: data.author_id,
    author_name: data.users?.nickname || '알 수 없음',
    author_avatar_url: data.users?.avatar_url || null,
    title: data.title,
    content: data.content,
    views_count: data.views_count,
    likes_count: data.likes_count,
    comments_count: data.comments_count,
    is_hidden: data.is_hidden,
    has_active_debates: data.has_active_debates,
    created_at: data.created_at,
    deletedAt: data.deleted_at,
    deletedReason: data.deleted_reason,
  };
}

export function mapToDiscussionTopic(data: any): DiscussionTopic {
  return {
    id: data.id,
    title: data.title,
    author: data.users?.nickname || '알 수 없음',
    authorAvatarUrl: data.users?.avatar_url || null,
    authorId: data.author_id,
    createdAt: formatRelativeTime(data.created_at),
    stanceA: data.stance_a,
    stanceB: data.stance_b,
    votesA: data.votes_a + (data.discussion_votes ? data.discussion_votes.filter((v: any) => v.stance === 'A').length : 0),
    votesB: data.votes_b + (data.discussion_votes ? data.discussion_votes.filter((v: any) => v.stance === 'B').length : 0),
    deletedAt: data.deleted_at,
    deletedReason: data.deleted_reason,
  };
}

export function mapToDiscussionComment(row: any): DiscussionComment {
  return {
    id: row.id,
    author: row.users?.nickname || '알 수 없음',
    authorAvatarUrl: row.users?.avatar_url || null,
    authorId: row.author_id,
    content: row.content,
    stance: row.stance,
    createdAt: formatRelativeTime(row.created_at),
    likes: row.likes_count,
    deletedAt: row.deleted_at,
    deletedReason: row.deleted_reason,
  };
}

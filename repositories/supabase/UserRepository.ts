import { createClient } from '@/utils/supabase/client';
import type { IUserRepository } from '../interfaces';
import type { UserProfileStats } from '@/types';

// 단기 캐싱을 위한 Map (1분)
const profileCache = new Map<string, { data: UserProfileStats, timestamp: number }>();

export const SupabaseUserRepository: IUserRepository = {
  async getCurrentUser() {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('id, nickname, role, is_public_profile')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return {
        id: user.id,
        name: user.user_metadata?.full_name || '사용자',
        role: 'user',
      };
    }

    return {
      id: profile.id,
      name: profile.nickname || '사용자',
      role: profile.role || 'user',
      isPublicProfile: profile.is_public_profile !== false
    };
  },

  async getProfileStats(uuid: string) {
    // 1분 메모리 캐싱 (단기 캐싱)
    const now = Date.now();
    const cached = profileCache.get(uuid);
    if (cached && (now - cached.timestamp < 60000)) {
      return cached.data;
    }

    const supabase = createClient();
    
    // 1. 유저 기본 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('nickname, avatar_url, role, is_public_profile, created_at')
      .eq('id', uuid)
      .single();

    if (userError || !user) {
      console.error('getProfileStats Error:', userError);
      return null;
    }

    const isPublic = user.is_public_profile !== false;
    let postCount = 0;
    let commentCount = 0;

    // 2. 공개인 경우에만 통계 쿼리를 병렬로 실행 (Promise.all)
    if (isPublic) {
      const [postsResult, topicsResult, commentsResult, discussionCommentsResult] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', uuid).is('deleted_at', null),
        supabase.from('discussion_topics').select('*', { count: 'exact', head: true }).eq('author_id', uuid).is('deleted_at', null),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('author_id', uuid).is('deleted_at', null),
        supabase.from('discussion_comments').select('*', { count: 'exact', head: true }).eq('author_id', uuid).is('deleted_at', null)
      ]);
      postCount = (postsResult.count || 0) + (topicsResult.count || 0);
      commentCount = (commentsResult.count || 0) + (discussionCommentsResult.count || 0);
    }

    const stats = {
      id: uuid,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      role: user.role,
      isPublic,
      createdAt: user.created_at,
      postCount,
      commentCount,
      debateRecord: '-' // 아직 전적 시스템 없음
    };

    // 캐싱
    profileCache.set(uuid, { data: stats, timestamp: now });

    return stats;
  },

  async updateProfileVisibility(uuid: string, isPublic: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // 이중 검증 (클라이언트 사이드 권한 체크)
    if (!user || user.id !== uuid) {
      throw new Error('프로필 설정 변경 권한이 없습니다.');
    }

    const { error } = await supabase
      .from('users')
      .update({ is_public_profile: isPublic })
      .eq('id', uuid);

    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
    
    // 상태가 변경되었으므로 캐시 삭제
    profileCache.delete(uuid);
  },

  async getMyPageActivity(uuid, client?) {
    const supabase = client || createClient();
    const { formatRelativeTime } = await import('@/lib/formatTime');
    
    // Fetch user's posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, title, board_type, created_at')
      .eq('author_id', uuid)
      .order('created_at', { ascending: false });

    // Fetch user's discussion topics
    const { data: topicsData } = await supabase
      .from('discussion_topics')
      .select('id, title, created_at')
      .eq('author_id', uuid)
      .order('created_at', { ascending: false });

    // Fetch user's comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select('id, content, post_id, created_at, posts!inner(board_type)')
      .eq('author_id', uuid)
      .order('created_at', { ascending: false });

    const { data: discussionCommentsData } = await supabase
      .from('discussion_comments')
      .select('id, content, topic_id, created_at, discussion_topics!inner(title)')
      .eq('author_id', uuid)
      .order('created_at', { ascending: false });

    const myPosts = [];
    if (postsData) {
      for (const p of postsData) {
        myPosts.push({
          id: `post-${p.id}`,
          title: p.title,
          boardName: p.board_type === 'free' ? '자유게시판' : '토의게시판',
          date: formatRelativeTime(p.created_at),
          originalDate: new Date(p.created_at).getTime(),
          link: `/board/${p.board_type}/${p.id}`
        });
      }
    }
    if (topicsData) {
      for (const t of topicsData) {
        myPosts.push({
          id: `topic-${t.id}`,
          title: t.title,
          boardName: '토론게시판',
          date: formatRelativeTime(t.created_at),
          originalDate: new Date(t.created_at).getTime(),
          link: `/board/debate/${t.id}`
        });
      }
    }
    myPosts.sort((a, b) => b.originalDate - a.originalDate);

    const myComments = [];
    if (commentsData) {
      for (const c of commentsData) {
        myComments.push({
          id: `comment-${c.id}`,
          content: c.content,
          boardName: c.posts?.board_type === 'free' ? '자유게시판' : '토의게시판',
          date: formatRelativeTime(c.created_at),
          originalDate: new Date(c.created_at).getTime(),
          link: `/board/${c.posts?.board_type}/${c.post_id}`
        });
      }
    }
    if (discussionCommentsData) {
      for (const dc of discussionCommentsData) {
        myComments.push({
          id: `discussion-comment-${dc.id}`,
          content: dc.content,
          boardName: '토론게시판',
          date: formatRelativeTime(dc.created_at),
          originalDate: new Date(dc.created_at).getTime(),
          link: `/board/debate/${dc.topic_id}`
        });
      }
    }
    myComments.sort((a, b) => b.originalDate - a.originalDate);

    // Fetch user's debates
    const { data: debatesData } = await supabase
      .from('debates')
      .select('id, topic, status, created_at, proposer_id, responder_id')
      .or(`proposer_id.eq.${uuid},responder_id.eq.${uuid}`)
      .order('created_at', { ascending: false });

    const myDebates = (debatesData || []).map((d: any) => ({
      id: `debate-${d.id}`,
      title: d.topic,
      boardName: d.status === 'in_progress' ? '진행중인 토론' : d.status === 'voting' ? '투표중인 토론' : '종료된 토론',
      date: formatRelativeTime(d.created_at),
      link: `/debate/live/${d.id}`
    }));

    return { myPosts, myComments, myDebates };
  },

  async deleteAccount(client?) {
    const supabase = client || createClient();
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  }
};

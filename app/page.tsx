import { createClient } from '@/utils/supabase/server';
import { HomeClient } from './HomeClient';
import { formatRelativeTime } from '@/lib/formatTime';

export default async function Home() {
  const supabase = await createClient();
  
  // 최근 진행중인 토론 10개
  const { data: debatesData } = await supabase
    .from('debates')
    .select(`
      *,
      proposer:users!debates_proposer_id_fkey(nickname, avatar_url),
      responder:users!debates_responder_id_fkey(nickname, avatar_url),
      turns(id)
    `)
    .order('created_at', { ascending: false })
    .limit(10);
    
  // 최근 논제 10개
  const { data: topicsData } = await supabase
    .from('discussion_topics')
    .select('*, users!discussion_topics_author_fkey(nickname, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(10);
    
  const debates = (debatesData || []).map((d: any, i: number) => ({
    id: d.id,
    title: d.topic,
    tag: d.status === 'in_progress' ? '진행중' : d.status === 'voting' ? '투표중' : '종료',
    tagColor: d.status === 'in_progress' ? 'bg-green-100 text-green-700 border-green-200' : d.status === 'voting' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-slate-100 text-slate-600 border-slate-200',
    claimA: d.originPreview || '',
    nickA: d.proposer?.nickname || '알 수 없음',
    uuidA: d.proposer_id || null,
    avatarA: d.proposer?.avatar_url || null,
    claimB: '',
    nickB: d.responder?.nickname || '알 수 없음',
    uuidB: d.responder_id || null,
    avatarB: d.responder?.avatar_url || null,
    hearts: 0,
    turns: Math.ceil((d.turns?.length || 0) / 2),
    status: d.status,
  }));

  const topics = (topicsData || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    author: row.users?.nickname || '알 수 없음',
    authorId: row.author_id || null,
    authorAvatarUrl: row.users?.avatar_url || null,
    createdAt: formatRelativeTime(row.created_at),
    stanceA: row.stance_a,
    stanceB: row.stance_b,
    votesA: row.votes_a,
    votesB: row.votes_b,
  }));
  
  // 자유게시판/토의게시판 최신글 4개씩
  const { data: freePosts } = await supabase
    .from('posts')
    .select('id, title')
    .eq('board_type', 'free')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(4);

  const { data: discussPosts } = await supabase
    .from('posts')
    .select('id, title')
    .eq('board_type', 'discuss')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(4);

  const freePostList = freePosts || [];
  const discussPostList = discussPosts || [];

  return <HomeClient debates={debates} topics={topics} freePosts={freePostList} discussPosts={discussPostList} />;
}

import { createClient } from '@/utils/supabase/server';
import { HomeClient } from './HomeClient';
import { formatRelativeTime } from '@/lib/formatTime';
import { debateRepository, discussionRepository, postRepository } from '@/repositories';

export default async function Home() {
  const supabase = await createClient();
  
  // 최근 진행중인 토론 10개
  const debatesData = await debateRepository.getRecentDebates(10, supabase);
    
  // 최근 논제 10개
  const topicsData = await discussionRepository.getRecentTopics(10, supabase);
    
  const debates = debatesData.map((d: any, i: number) => ({
    id: d.id,
    title: d.topic,
    tag: d.status === 'in_progress' ? '진행중' : d.status === 'voting' ? '투표중' : '종료',
    tagColor: d.status === 'in_progress' ? 'bg-green-100 text-green-700 border-green-200' : d.status === 'voting' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-slate-100 text-slate-600 border-slate-200',
    claimA: d.proposerClaim || d.originPreview || '',
    nickA: d.proposerName,
    uuidA: d.proposerId || null,
    avatarA: d.proposerAvatarUrl || null,
    claimB: d.responderClaim || '',
    nickB: d.responderName,
    uuidB: d.responderId || null,
    avatarB: d.responderAvatarUrl || null,
    hearts: 0,
    turns: d.round * 2,
    status: d.status,
  }));

  const topics = topicsData.map((row: any) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    authorId: row.authorId || null,
    authorAvatarUrl: row.authorAvatarUrl || null,
    createdAt: formatRelativeTime(row.createdAt),
    stanceA: row.stanceA,
    stanceB: row.stanceB,
    votesA: row.votesA,
    votesB: row.votesB,
  }));
  
  // 자유게시판/토의게시판 최신글 4개씩
  const freePostList = await postRepository.getRecentPosts('free', 4, supabase);
  const discussPostList = await postRepository.getRecentPosts('discuss', 4, supabase);

  return <HomeClient debates={debates} topics={topics} freePosts={freePostList} discussPosts={discussPostList} />;
}

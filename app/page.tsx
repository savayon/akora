import { createClient } from '@/utils/supabase/server';
import { HomeClient } from './HomeClient';
import { discussionRepository, postRepository } from '@/repositories';
import { DebateService } from '@/services/DebateService';

export default async function Home() {
  try {
    const supabase = await createClient();
    
    // 최근 진행중인 토론 10개 (Summary DTO)
    const debates = await DebateService.getRecentDebateSummaries(10, supabase);
      
    // 최근 논제 10개
    const topics = await discussionRepository.getRecentTopics(10, supabase);
    
    // 자유게시판/토의게시판 최신글 4개씩
    const freePostList = await postRepository.getRecentPosts('free', 4, supabase);
    const discussPostList = await postRepository.getRecentPosts('discuss', 4, supabase);

    return <HomeClient debates={debates as any} topics={topics} freePosts={freePostList} discussPosts={discussPostList} />;
  } catch (error: any) {
    console.error("Home SSR Error:", error);
    return (
      <div className="p-8 text-red-500 font-bold">
        <h1>Server Rendering Error</h1>
        <pre className="mt-4 p-4 bg-red-50 text-sm whitespace-pre-wrap">
          {error.message || String(error)}
          {'\n\nStack:\n'}{error.stack}
        </pre>
      </div>
    );
  }
}

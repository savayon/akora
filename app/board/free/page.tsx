import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AuthLink } from '@/components/AuthLink';
import { postRepository } from '@/repositories';
import { SearchBar } from '@/components/SearchBar';
import { BoardListTable } from '@/components/board/BoardListTable';

export default async function FreeBoardPage() {
  const supabase = await createClient();
  const posts = await postRepository.getPosts('free', supabase);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 타이틀 및 설명 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">자유게시판</h1>
        <p className="text-slate-500">자유롭게 의견을 나누고 토론의 씨앗을 발견하세요.</p>
      </div>

      {/* 필터 및 글쓰기 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer shadow-sm">
              <option value="recent">최신순</option>
              <option value="popular">인기순</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar placeholder="자유게시판 검색..." />
          <AuthLink href="/board/write?board=free" className="shrink-0 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
            ✍️ 글쓰기
          </AuthLink>
        </div>
      </div>

      {/* 테이블 형태 게시글 목록 */}
      <BoardListTable posts={posts} boardType="free" />

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors">&lt;</button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-slate-900 text-white font-bold shadow-sm">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">&gt;</button>
        </div>
      </div>

    </div>
  );
}

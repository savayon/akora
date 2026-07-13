"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { TopicCard } from '@/components/TopicCard';
import { AuthLink } from '@/components/AuthLink';
import { SearchBar } from '@/components/SearchBar';
import type { DiscussionTopic } from '@/types';

type Props = {
  topics: DiscussionTopic[];
};

export function DebateBoardClient({ topics }: Props) {
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const sortedTopics = [...topics].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.votesA + b.votesB) - (a.votesA + a.votesB);
    }
    return 0; // 이미 서버에서 최신순 정렬
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-8 border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">토론게시판</h1>
        <p className="text-slate-500">논리를 겨루고 사람들을 설득하세요. 새로운 주제를 만들고 투표를 받아 토론을 성사시킬 수 있습니다.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
              className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer shadow-sm"
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar placeholder="토론 주제 검색..." />
          <AuthLink href="/board/debate/create" className="shrink-0 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black px-4 py-2 rounded-lg text-sm transition-colors shadow-sm inline-block">
            ✍️ 주제 만들기
          </AuthLink>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 -mx-6 rounded-3xl border border-slate-100">
        <div className="flex flex-col gap-4">
          {sortedTopics.length > 0 ? sortedTopics.map(topic => (
            <TopicCard key={topic.id} topic={topic} layout="list" />
          )) : (
            <div className="py-16 text-center text-slate-400 font-medium">
              아직 주제가 없습니다. 첫 주제를 만들어보세요!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SearchResultItem } from '@/types';
import { SearchIcon } from '@/components/icons';

type Props = {
  initialKeyword: string;
  initialResults: SearchResultItem[];
};

export default function SearchClient({ initialKeyword, initialResults }: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [activeTab, setActiveTab] = useState<'all' | 'free' | 'discuss' | 'debate'>('all');

  // URL에서 전달받은 검색어가 바뀔 때마다 로컬 state 업데이트
  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed === '') return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const freeResults = initialResults.filter(r => r.domain === 'free');
  const discussResults = initialResults.filter(r => r.domain === 'discuss');
  const debateResults = initialResults.filter(r => r.domain === 'debate');

  let filteredResults = initialResults;
  if (activeTab === 'free') filteredResults = freeResults;
  if (activeTab === 'discuss') filteredResults = discussResults;
  if (activeTab === 'debate') filteredResults = debateResults;

  const domainLabels = {
    free: '게시글',
    discuss: '논제',
    debate: '토론'
  };

  const domainColors = {
    free: 'bg-blue-100 text-blue-700',
    discuss: 'bg-green-100 text-green-700',
    debate: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto mb-8">
        <input 
          type="text" 
          name="q"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어를 입력하세요..." 
          className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        <SearchIcon className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <button type="submit" className="hidden">검색</button>
      </form>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          전체 ({initialResults.length})
        </button>
        <button
          onClick={() => setActiveTab('free')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'free'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          게시글 ({freeResults.length})
        </button>
        <button
          onClick={() => setActiveTab('discuss')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'discuss'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          논제 ({discussResults.length})
        </button>
        <button
          onClick={() => setActiveTab('debate')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'debate'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          토론 ({debateResults.length})
        </button>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {initialKeyword.trim() === '' ? (
          <div className="text-center py-20 text-slate-500">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg">검색어를 입력해보세요.</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">검색 결과가 없습니다.</p>
            <p className="text-sm mt-2 text-slate-400">다른 검색어를 입력해보세요.</p>
          </div>
        ) : (
          filteredResults.map((item) => (
            <Link 
              key={`${item.domain}-${item.id}`} 
              href={item.url}
              className="block p-5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${domainColors[item.domain]}`}>
                  {domainLabels[item.domain]}
                </span>
                <span className="text-sm text-slate-500">{item.createdAt}</span>
                <span className="text-sm text-slate-400 mx-1">•</span>
                <span className="text-sm text-slate-500 font-medium">{item.authorName}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {item.title}
              </h3>
              {item.contentPreview && (
                <p className="text-slate-600 text-sm line-clamp-2">
                  {item.contentPreview}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

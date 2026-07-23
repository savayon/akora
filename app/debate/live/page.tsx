"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { DebateCard } from '@/components/DebateCard';
import { DebateService, type DebateSummaryDto } from '@/services/DebateService';

export default function LiveDebatePage() {
  const [debates, setDebates] = useState<DebateSummaryDto[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // Spotlight 캐러셀 스크롤 상태
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (spotlightRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = spotlightRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const fetchDebates = async () => {
      const data = await DebateService.getActiveDebateSummaries();
      setDebates(data);
    };
    fetchDebates();

    const timer = setTimeout(() => handleScroll(), 150);
    window.addEventListener('resize', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (spotlightRef.current && spotlightRef.current.firstElementChild) {
      const itemWidth = (spotlightRef.current.firstElementChild as HTMLElement).offsetWidth;
      const gap = window.innerWidth >= 768 ? 24 : 16;
      const amount = (itemWidth + gap) * 2;
      spotlightRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const spotlightDebates = debates.filter((d) => d.debate.status === 'in_progress').slice(0, 3);
  
  const sortedDebates = [...debates].sort((a, b) => {
    if (sortBy === 'popular') return b.debate.round - a.debate.round; // Use round instead of turns
    return Number(b.debate.id) - Number(a.debate.id);
  });

  const totalPages = Math.max(1, Math.ceil(sortedDebates.length / PAGE_SIZE));
  const pagedDebates = sortedDebates.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 타이틀 및 설명 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">1:1 토론</h1>
        <p className="text-slate-500 font-medium">아고라에서 진행 중인 치열한 논쟁들을 실시간으로 관전하고 투표하세요.</p>
      </div>

      {/* 🚀 스포트라이트 (가로 스와이프 캐러셀) */}
      <div className="mb-12 relative">
        <div className="flex items-center gap-2 mb-4 px-2">
          <span className="text-xl">🔥</span>
          <h2 className="text-xl font-black text-slate-900">스포트라이트</h2>
        </div>
        
        <div className="relative group">
          <button 
            onClick={() => scrollByAmount('left')} 
            disabled={!canScrollLeft}
            className={`absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-800 font-black text-xl transition-all ${!canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-105'}`}
            aria-label="이전"
          >
            &lt;
          </button>

          <div 
            ref={spotlightRef} 
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 px-2 [&::-webkit-scrollbar]:hidden"
          >
            {spotlightDebates.map(debate => (
              <DebateCard key={`spotlight-${debate.debate.id}`} summary={debate} layout="carousel" />
            ))}
          </div>

          <button 
            onClick={() => scrollByAmount('right')} 
            disabled={!canScrollRight}
            className={`absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-800 font-black text-xl transition-all ${!canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-slate-50 hover:scale-105'}`}
            aria-label="다음"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-8 mb-6"></div>

      {/* 필터 및 검색 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          {/* 정렬 드롭다운 */}
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as 'latest' | 'popular'); setPage(0); }}
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
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="토론 검색..." 
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      {/* 컨텐츠 리스트 뷰 (세로 1열 가로확장) */}
      <div className="bg-slate-50/50 p-6 -mx-6 rounded-3xl border border-slate-100">
        <div className="flex flex-col gap-4">
          {pagedDebates.map(debate => (
            <DebateCard key={`d-${debate.debate.id}`} summary={debate} layout="list" />
          ))}
          {pagedDebates.length === 0 && (
            <div className="py-16 text-center text-slate-400 font-bold">진행 중인 토론이 없습니다.</div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 font-bold text-sm text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              ← 이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-9 h-9 rounded-lg font-black text-sm transition-colors ${
                  page === i
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 font-bold text-sm text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              다음 →
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

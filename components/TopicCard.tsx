import React from 'react';
import Link from 'next/link';
import { UserAvatar } from './UserBadge';

import { DiscussionTopic } from '@/types';

export const TopicCard = ({ topic, layout = 'carousel', className = '' }: { topic: DiscussionTopic, layout?: 'carousel' | 'grid' | 'list', className?: string }) => {
  const baseClasses = "bg-white border rounded-2xl shadow-sm hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer block group/card";
  const carouselClasses = "border-gray-200 snap-start shrink-0 w-[300px] sm:w-[340px] md:w-[380px] p-4 flex flex-col";
  const gridClasses = "border-gray-200 w-full h-full p-4 flex flex-col";
  const listClasses = "border-slate-300 border-[1.5px] w-full p-4 md:p-5 flex flex-col gap-3 hover:-translate-y-0.5";
  
  const layoutClasses = layout === 'grid' ? gridClasses : layout === 'list' ? listClasses : carouselClasses;

  if (layout === 'list') {
    return (
      <Link href={`/board/debate/${topic.id}`} className={`${baseClasses} ${layoutClasses} ${className}`}>
        
        {/* 리스트 레이아웃: 가로 한 줄 정렬 (좌-제목 / 우-메타) */}
        <div className="flex items-center justify-between w-full relative mb-1">
          <div className="flex-1 flex justify-start items-center pr-4">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 group-hover/card:text-yellow-600 transition-colors truncate">
              {topic.title}
            </h3>
          </div>
          <div className="shrink-0 flex justify-end items-center gap-4">
            <span className="bg-yellow-50 px-3 py-1.5 rounded text-yellow-700 font-bold text-sm whitespace-nowrap">🙋‍♂️ {topic.votesA + topic.votesB}명 참여중</span>
            <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap hidden md:inline transition-colors group-hover/card:bg-yellow-100 group-hover/card:text-yellow-700">참여하기 &gt;</span>
          </div>
        </div>

        {/* 제안자의 두 가지 가설(주장) - 세로로 배치되지만 리스트에 맞게 넓게 */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
            <div className="text-[11px] font-black text-blue-600 mb-1">주장 A</div>
            <h4 className="text-[14px] font-bold text-slate-700 leading-snug">"{topic.stanceA}"</h4>
          </div>
          
          {/* VS 구분 (리스트 레이아웃용) */}
          <div className="flex justify-center items-center sm:-mx-3 relative z-10 -my-2 sm:my-0">
            <div className="w-7 h-7 flex items-center justify-center bg-white text-slate-900 rounded-full text-[10px] font-black italic shadow-sm border border-slate-200">VS</div>
          </div>

          <div className="flex-1 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
            <div className="text-[11px] font-black text-orange-600 mb-1">주장 B</div>
            <h4 className="text-[14px] font-bold text-slate-700 leading-snug">"{topic.stanceB}"</h4>
          </div>
        </div>
      </Link>
    );
  }

  return (
  <Link href={`/board/debate/${topic.id}`} className={`${baseClasses} ${layoutClasses} ${className}`}>
    {/* 카드 헤더 */}
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-black px-2 py-0.5 rounded">제안된 주제</span>
        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
          <UserAvatar name={topic.author} uuid={topic.authorId} avatarUrl={topic.authorAvatarUrl} size="w-3.5 h-3.5" iconSize="w-2.5 h-2.5" containerClass="bg-white border border-slate-200 shadow-sm" />
          {topic.author}
        </span>
      </div>
      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover/card:text-yellow-600 transition-colors">
        {topic.title}
      </h3>
    </div>
    
    {/* 제안자의 두 가지 가설(주장) */}
    <div className="flex-1 flex flex-col gap-1.5 mb-4">
      <div className="w-[80%] mr-auto bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-left relative">
        <div className="text-[10px] font-black text-blue-600 mb-0.5">주장 A</div>
        <h4 className="text-[13px] font-bold text-slate-700 leading-snug">"{topic.stanceA}"</h4>
      </div>
      
      {/* VS 구분 */}
      <div className="flex justify-center -my-2.5 relative z-10">
        <div className="w-6 h-6 flex items-center justify-center bg-white text-slate-900 rounded-full text-[9px] font-black italic shadow-sm border border-slate-200">VS</div>
      </div>
      
      <div className="w-[80%] ml-auto bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-left relative">
        <div className="text-[10px] font-black text-orange-600 mb-0.5 flex justify-end">주장 B</div>
        <h4 className="text-[13px] font-bold text-slate-700 leading-snug">"{topic.stanceB}"</h4>
      </div>
    </div>
    
    {/* 카드 하단 메타 */}
    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mt-auto pt-3 border-t border-slate-100">
      <span className="bg-yellow-50 px-2 py-1 rounded text-yellow-700">🙋‍♂️ {topic.votesA + topic.votesB}명 참여중</span>
      <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors group-hover/card:bg-yellow-100 group-hover/card:text-yellow-700">참여하기 &gt;</span>
    </div>
  </Link>
  );
};

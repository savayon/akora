import React from 'react';
import { UserBadge, UserAvatar } from './UserBadge';

export interface DebateData {
  id: number;
  title: string;
  tag: string;
  tagColor: string;
  claimA: string;
  nickA: string;
  uuidA?: string | null;
  avatarA?: string | null;
  claimB: string;
  nickB: string;
  uuidB?: string | null;
  avatarB?: string | null;
  hearts: number;
  turns: number;
}

import Link from 'next/link';

export const DebateCard = ({ debate, layout = 'carousel', className = '' }: { debate: DebateData, layout?: 'carousel' | 'grid' | 'list', className?: string }) => {
  const baseClasses = "bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer block group/card";
  const carouselClasses = "snap-start shrink-0 w-[300px] sm:w-[340px] md:w-[380px] p-4 flex flex-col";
  const gridClasses = "w-full h-full p-4 flex flex-col";
  const listClasses = "border-[1.5px] w-full p-4 md:p-5 flex flex-col gap-3 hover:-translate-y-0.5";

  const layoutClasses = layout === 'grid' ? gridClasses : layout === 'list' ? listClasses : carouselClasses;

  if (layout === 'list') {
    return (
      <Link href={`/debate/live/${debate.id}`} className={`${baseClasses} ${layoutClasses} ${className}`}>
        
        {/* 리스트 레이아웃: 가로 한 줄 정렬 (좌-태그 / 중-제목 / 우-메타) */}
        <div className="flex items-center justify-between w-full relative">
          <div className="flex-1 flex justify-start items-center gap-2">
            <span className={`inline-block ${debate.tagColor} text-[11px] font-black px-2.5 py-1 rounded whitespace-nowrap`}>{debate.tag}</span>
          </div>
          <div className="shrink-0 max-w-[40%] sm:max-w-[50%] text-center px-4">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 group-hover/card:text-yellow-600 transition-colors truncate">
              {debate.title}
            </h3>
          </div>
          <div className="flex-1 flex justify-end items-center gap-4">
            <span className="flex items-center gap-1 font-bold text-sm whitespace-nowrap"><span className="text-red-500 text-base">🔥</span> {debate.hearts}명 관심</span>
            <span className="bg-slate-200 px-3 py-1.5 rounded text-slate-700 font-bold text-sm whitespace-nowrap hidden md:inline">💬 {debate.turns}턴째 진행중</span>
            <span className="bg-purple-50 text-purple-600 border border-purple-100 px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap hidden md:inline ml-2 transition-colors group-hover/card:bg-purple-100 group-hover/card:text-purple-700">관전하기 &gt;</span>
          </div>
        </div>

        {/* 주장(Claim) 중심의 좌/우 수평 레이아웃 (리스트뷰 전용) */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* 주장 A */}
          <div className="flex-1 bg-blue-50/60 px-3 py-2.5 rounded-xl border border-blue-100 flex flex-col justify-center">
            <h4 className="text-[14px] font-black text-blue-700 leading-snug mb-1.5">"{debate.claimA}"</h4>
            <div className="text-[10px] font-bold text-slate-500 mt-auto flex items-center gap-1.5">
              <UserAvatar name={debate.nickA} uuid={debate.uuidA} avatarUrl={debate.avatarA} size="w-4 h-4" iconSize="w-3 h-3" containerClass="border border-blue-200 bg-white" />
              {debate.nickA}
            </div>
          </div>
          
          {/* VS 구분 */}
          <div className="flex justify-center items-center sm:-mx-3 relative z-10 -my-2 sm:my-0">
            <div className="w-7 h-7 flex items-center justify-center bg-white text-slate-900 rounded-full text-[10px] font-black italic shadow-sm border border-slate-200">VS</div>
          </div>
          
          {/* 주장 B */}
          <div className="flex-1 bg-orange-50/60 px-3 py-2.5 rounded-xl border border-orange-100 flex flex-col justify-center">
            <h4 className="text-[14px] font-black text-orange-600 leading-snug mb-1.5">"{debate.claimB}"</h4>
            <div className="text-[10px] font-bold text-slate-500 mt-auto flex items-center gap-1.5 justify-end">
              {debate.nickB || debate.nickA}
              <UserAvatar name={debate.nickB} uuid={debate.uuidB} avatarUrl={debate.avatarB || debate.avatarA} size="w-4 h-4" iconSize="w-3 h-3" containerClass="border border-orange-200 bg-white" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
  <Link href={`/debate/live/${debate.id}`} className={`${baseClasses} ${layoutClasses} ${className}`}>
    {/* 카드 헤더 */}
    <div className="mb-3">
      <span className={`inline-block ${debate.tagColor} text-[11px] font-black px-2 py-0.5 rounded mb-1.5`}>{debate.tag}</span>
      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover/card:text-yellow-600 transition-colors">
        {debate.title}
      </h3>
    </div>
    
    {/* 주장(Claim) 중심의 상/하 수직 레이아웃 */}
    <div className="flex-1 flex flex-col gap-1.5 mb-4">
      {/* 주장 A */}
      <div className="w-[80%] mr-auto bg-blue-50/60 px-3 py-2 rounded-xl border border-blue-100 flex flex-col justify-center text-left relative">
        <h4 className="text-[14px] font-black text-blue-700 leading-snug mb-1">"{debate.claimA}"</h4>
        <div className="text-[10px] sm:text-xs font-bold text-slate-500 mt-auto flex items-center gap-1.5">
          <UserAvatar name={debate.nickA} uuid={debate.uuidA} avatarUrl={debate.avatarA} size="w-3.5 h-3.5" iconSize="w-2.5 h-2.5" containerClass="border border-blue-200 bg-white" />
          {debate.nickA}
        </div>
      </div>
      
      {/* VS 구분 */}
      <div className="flex justify-center -my-2.5 relative z-10">
        <div className="w-6 h-6 flex items-center justify-center bg-white text-slate-900 rounded-full text-[9px] font-black italic shadow-sm border border-slate-200">VS</div>
      </div>
      
      {/* 주장 B */}
      <div className="w-[80%] ml-auto bg-orange-50/60 px-3 py-2 rounded-xl border border-orange-100 flex flex-col justify-center text-left relative">
        <h4 className="text-[14px] font-black text-orange-600 leading-snug mb-1">"{debate.claimB}"</h4>
        <div className="text-[10px] sm:text-xs font-bold text-slate-500 mt-auto flex items-center justify-end gap-1.5">
          {debate.nickB || debate.nickA /* Fallback mock */}
          <UserAvatar name={debate.nickB} uuid={debate.uuidB} avatarUrl={debate.avatarB || debate.avatarA} size="w-3.5 h-3.5" iconSize="w-2.5 h-2.5" containerClass="border border-orange-200 bg-white" />
        </div>
      </div>
    </div>
    
    {/* 카드 하단 메타 */}
    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mt-auto pt-3 pb-3 px-4 -mx-4 -mb-4 bg-purple-50/80 rounded-b-2xl border-t border-purple-100">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="text-red-500 text-sm">🔥</span> {debate.hearts}명 관심</span>
        <span className="bg-slate-200 px-2 py-1 rounded text-slate-700">💬 {debate.turns}턴째 진행중</span>
      </div>
      <span className="text-purple-600 font-black group-hover/card:text-purple-800 transition-colors">관전하기 &gt;</span>
    </div>
  </Link>
  );
};

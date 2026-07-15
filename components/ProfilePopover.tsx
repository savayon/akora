"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SupabaseUserRepository } from '@/repositories/supabase/UserRepository';
import type { UserProfileStats } from '@/types';
import { UserAvatar } from './UserBadge';

export function ProfilePopover() {
  const { profilePopover, closeProfilePopover } = useAppStore();
  const { isOpen, userId, rect } = profilePopover;
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 화면 밖으로 넘어가지 않도록 위치 자동 조정
  const getPopoverStyle = () => {
    if (!rect) return { top: -9999, left: -9999 };
    
    const POPOVER_WIDTH = 340; // 최대 너비
    const GAP = 12; // 프로필 사진과의 간격
    
    // 기본적으로 아래 중앙 정렬
    let top = rect.bottom + GAP + window.scrollY;
    let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2 + window.scrollX;

    // 브라우저 경계 체크
    if (typeof window !== 'undefined') {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // 오른쪽 밖으로 나가는 경우 우측 정렬 느낌으로 이동
      if (left + POPOVER_WIDTH > windowWidth - 16) {
        left = windowWidth - POPOVER_WIDTH - 16 + window.scrollX;
      }
      
      // 왼쪽 밖으로 나가는 경우 좌측 정렬 느낌으로 이동
      if (left < 16) {
        left = 16 + window.scrollX;
      }

      // 팝오버 예상 높이를 320으로 잡고 화면 아래로 짤리는지 확인
      // 만약 짤린다면 위쪽으로 띄움
      if (rect.bottom + GAP + 320 > windowHeight && rect.top - GAP - 320 > 0) {
        top = rect.top - GAP - 320 + window.scrollY;
      }
    }

    return { top, left };
  };

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      SupabaseUserRepository.getProfileStats(userId)
        .then((data) => {
          setStats(data);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setStats(null);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    // 바깥쪽 클릭 시 닫기
    const handleClickOutside = (e: MouseEvent) => {
      // 팝오버 자체를 클릭한 거라면 유지
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      
      // 혹시 클릭한 요소가 UserAvatar나 그 내부라면 닫지 않음 (열기/토글 로직이 우선함)
      const target = e.target as HTMLElement;
      if (target.closest('[data-user-avatar]')) {
        return;
      }

      closeProfilePopover();
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeProfilePopover]);

  if (!isOpen || !rect) return null;

  return (
    <div 
      ref={popoverRef}
      className="absolute z-[9999] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 p-6 w-[320px] sm:w-[340px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
      style={getPopoverStyle()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 닫기 버튼 */}
      <button 
        onClick={(e) => { e.stopPropagation(); closeProfilePopover(); }}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {loading ? (
        <div className="py-12 flex flex-col items-center w-full">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-bold mt-4">프로필 정보를 불러오는 중...</p>
        </div>
      ) : stats ? (
        <div className="w-full flex flex-col items-center">
          <UserAvatar 
            name={stats.nickname} 
            uuid={stats.id} 
            avatarUrl={stats.avatarUrl} 
            size="w-20 h-20" 
            iconSize="w-12 h-12" 
            containerClass="shadow-sm border border-slate-100" 
            disableClick={true}
          />
          <h3 className="text-xl font-black mt-3 flex items-center gap-2">
            {stats.nickname}
            {stats.role === 'admin' && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                관리자
              </span>
            )}
            {stats.persuasionCount && stats.persuasionCount > 0 ? (
              <span className="bg-orange-50 border border-orange-200 text-orange-600 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black whitespace-nowrap shadow-sm" title={`설득에 성공한 횟수: ${stats.persuasionCount}회`}>
                설득왕 {stats.persuasionCount}
              </span>
            ) : null}
          </h3>
          
          {stats.isPublic ? (
            <>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                가입일: {new Date(stats.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              <div className="flex w-full justify-between gap-2 mt-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 flex flex-col items-center justify-center min-w-0">
                  <span className="text-[11px] sm:text-xs text-slate-500 font-bold mb-1 truncate w-full text-center">작성한 글</span>
                  <span className="text-lg sm:text-xl font-black text-slate-800">{stats.postCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 flex flex-col items-center justify-center min-w-0">
                  <span className="text-[11px] sm:text-xs text-slate-500 font-bold mb-1 truncate w-full text-center">작성한 댓글</span>
                  <span className="text-lg sm:text-xl font-black text-slate-800">{stats.commentCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 flex flex-col items-center justify-center min-w-0">
                  <span className="text-[11px] sm:text-xs text-slate-500 font-bold mb-1 truncate w-full text-center">토론 전적</span>
                  <span className="text-lg sm:text-xl font-black text-slate-800 leading-none">-</span>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">(준비중)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 bg-slate-50 border border-slate-100 w-full rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <svg className="w-6 h-6 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <p className="text-sm font-bold text-slate-500">비공개 프로필입니다.</p>
            </div>
          )}

          <button 
            disabled 
            className="w-full mt-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg font-bold text-sm transition-colors cursor-not-allowed"
          >
            프로필 보기 (준비중)
          </button>
        </div>
      ) : (
        <div className="py-8 text-slate-500 text-sm font-bold w-full text-center">프로필을 불러올 수 없습니다.</div>
      )}
    </div>
  );
}

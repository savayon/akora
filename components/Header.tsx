"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from '@/store/useAppStore';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { LoginModal } from './LoginModal';
import { UserAvatar } from './UserBadge';
import { notificationRepository } from '@/repositories';
import { SearchBar } from '@/components/SearchBar';

export default function Header() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { notifications, isNotiOpen, setIsNotiOpen, markAllAsRead, markAsRead, removeNotification, currentUser, setCurrentUser, isLoginModalOpen, setIsLoginModalOpen } = useAppStore();
  
  const notiRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();

  // 안 읽은 알림 개수 계산
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 팝오버 외부 클릭 시 닫힘 처리
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotiOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notiRef, userMenuRef]);

  // Supabase 로그인 세션 감지
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // 알림 목록 가져오기
  useEffect(() => {
    if (currentUser && currentUser.id) {
      notificationRepository.getUserNotifications(currentUser.id).then((fetchedNotis: any) => {
        useAppStore.setState({ notifications: fetchedNotis });
      }).catch(console.error);
    }
  }, [currentUser, isNotiOpen]);

  const handleMarkAllAsRead = async () => {
    if (!currentUser.id) return;
    markAllAsRead();
    try {
      await notificationRepository.markAllAsRead(currentUser.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsRead = async (id: string | number) => {
    markAsRead(id);
    try {
      await notificationRepository.markAsRead(String(id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    removeNotification(id);
    try {
      await notificationRepository.deleteNotification(String(id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser({ id: '', name: '일반시민', role: 'user', isOnboarded: true });
    setIsUserMenuOpen(false);
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center group">
              <img src="/logo.png" alt="아고라 로고" className="h-10 md:h-14 w-auto object-contain transition-transform group-hover:scale-105 mix-blend-multiply" />
            </Link>
            <nav className="hidden md:flex gap-6 font-semibold text-slate-600">
              <Link href="/board/debate" className={`hover:text-purple-600 transition-colors ${pathname.includes('/board/debate') ? 'text-purple-600 font-bold' : ''}`}>토론게시판</Link>
              <Link href="/debate/live" className={`hover:text-purple-600 transition-colors ${pathname.includes('/debate/live') ? 'text-purple-600 font-bold' : ''}`}>1:1 토론</Link>
              <Link href="/board/free" className={`hover:text-purple-600 transition-colors ${pathname.includes('/board/free') ? 'text-purple-600 font-bold' : ''}`}>자유게시판</Link>
              <Link href="/board/discuss" className={`hover:text-purple-600 transition-colors ${pathname.includes('/board/discuss') ? 'text-purple-600 font-bold' : ''}`}>토의게시판</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium relative">
            <SearchBar variant="header" />
            <span className="text-gray-300 hidden sm:inline">|</span>
            
            {isLoggedIn ? (
              pathname === '/onboarding' ? (
                <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  로그아웃
                </button>
              ) : (
              <div className="flex items-center gap-4 relative" ref={notiRef}>
                {/* 알림 아이콘 & 뱃지 */}
                <button 
                  onClick={() => setIsNotiOpen(!isNotiOpen)}
                  className={`relative p-2 rounded-full transition-colors cursor-pointer ${isNotiOpen ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {/* 알림 팝오버 */}
                {isNotiOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-800">알림</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors">
                          모두 읽음
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length > 0 ? notifications.map((noti) => (
                        <Link 
                          href={noti.link} 
                          key={noti.id}
                          onClick={() => {
                            handleMarkAsRead(noti.id);
                            setIsNotiOpen(false);
                          }}
                          className={`flex items-start gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${!noti.isRead ? 'bg-purple-50/30' : ''}`}
                        >
                          <span className="text-2xl leading-none mt-1">{noti.icon}</span>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-[13px] font-bold text-slate-800 leading-snug mb-1">
                              {noti.message}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                              {noti.subtext}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1.5">{noti.createdAt}</p>
                          </div>
                          {!noti.isRead && (
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                          )}
                          <button 
                            onClick={(e) => handleDeleteNotification(e, noti.id)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                            aria-label="알림 삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </Link>
                      )) : (
                        <div className="p-8 text-center text-slate-500 text-sm">새로운 알림이 없습니다.</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="text-slate-600 hover:text-slate-900 transition-colors font-bold flex items-center gap-2 hidden sm:flex cursor-pointer"
                  >
                    <UserAvatar name={currentUser.name} uuid={currentUser.id} avatarUrl={currentUser.avatarUrl} size="w-8 h-8" iconSize="w-5 h-5" />
                    {currentUser.name}
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      
                      <div className="border-t border-slate-100">
                        {currentUser.role === 'admin' && (
                          <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="block w-full text-left px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 transition-colors">
                            관리자 페이지
                          </Link>
                        )}
                        <Link href="/mypage" onClick={() => setIsUserMenuOpen(false)} className="block w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                          마이페이지
                        </Link>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                          로그아웃
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )
            ) : (
              <>
                <button 
                  onClick={() => setIsLoginModalOpen(true)} 
                  className="bg-slate-900 hover:bg-slate-800 text-white hidden sm:inline transition-colors font-bold px-4 py-2 rounded-lg text-sm shadow-sm cursor-pointer"
                >
                  로그인 / 회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
}

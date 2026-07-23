"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { UserAvatar } from '@/components/UserBadge';
import { userRepository } from '@/repositories';
import { AuthService } from '@/services';

type ActivityItem = {
  id: string;
  title?: string;
  content?: string;
  date: string;
  boardName: string;
  link: string;
  isDisabled?: boolean;
};

type Props = {
  userProfile: any;
  myPosts: ActivityItem[];
  myComments: ActivityItem[];
  myDebates: ActivityItem[];
  myWatchedDebates: ActivityItem[];
};

function getActivityBadgeClass(boardName: string) {
  if (boardName.includes('진행중인 토론')) {
    return 'bg-green-100 text-green-700 border-green-200';
  }

  if (boardName.includes('투표중인 토론')) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }

  return 'bg-slate-100 text-slate-500 border-slate-200';
}

export function MyPageClient({ userProfile, myPosts, myComments, myDebates, myWatchedDebates }: Props) {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'debates' | 'watchedDebates'>('posts');
  const [isPublic, setIsPublic] = useState(userProfile?.isPublic ?? true);
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState(userProfile?.nickname || '');
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  const handleLogout = async () => {
    await AuthService.signOut();
    setCurrentUser({ id: '', name: '일반시민', role: 'user', isOnboarded: true });
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말 아고라를 탈퇴하시겠습니까? 탈퇴 시 기존 작성한 글과 댓글은 익명으로 보존되며, 작성자 정보는 삭제됩니다. 이 작업은 되돌릴 수 없습니다.')) return;
    
    try {
      await userRepository.deleteAccount();
      
      await AuthService.signOut();
      setCurrentUser({ id: '', name: '일반시민', role: 'user', isOnboarded: true });
      alert('회원탈퇴가 완료되었습니다.');
      router.push('/');
    } catch (e: any) {
      alert(e.message || '회원탈퇴 중 오류가 발생했습니다.');
    }
  };

  const handleToggleVisibility = async () => {
    if (!userProfile?.id || isUpdatingPublic) return;
    
    const nextState = !isPublic;
    setIsPublic(nextState);
    setIsUpdatingPublic(true);
    
    try {
      await userRepository.updateProfileVisibility(userProfile.id, nextState);
    } catch (e: any) {
      alert(e.message || '설정 변경 중 오류가 발생했습니다.');
      setIsPublic(!nextState); // revert
    } finally {
      setIsUpdatingPublic(false);
    }
  };

  const handleUpdateNickname = async () => {
    if (!editNickname.trim() || editNickname === userProfile?.nickname) {
      setIsEditingNickname(false);
      return;
    }
    
    if (!/^[a-zA-Z0-9가-힣]+$/.test(editNickname.trim())) {
      alert('닉네임에는 띄어쓰기나 특수문자를 사용할 수 없습니다.');
      return;
    }
    
    setIsUpdatingNickname(true);
    try {
      await userRepository.updateUserProfile(userProfile.id, { nickname: editNickname.trim() });
      
      setCurrentUser({
        id: userProfile.id,
        name: editNickname.trim(),
        role: userProfile.role,
        isOnboarded: true,
      });
      
      alert('닉네임이 성공적으로 변경되었습니다.');
      setIsEditingNickname(false);
      
      // 화면 업데이트를 위해 새로고침
      window.location.reload();
    } catch (e: any) {
      alert(e.message || '닉네임 변경 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      
      {/* 1. 프로필 영역 */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
        <UserAvatar name={userProfile?.nickname} uuid={userProfile?.id} avatarUrl={userProfile?.avatarUrl} size="w-24 h-24" iconSize="w-16 h-16" containerClass="border-4 border-slate-100 shadow-inner" />
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  maxLength={20}
                  className="px-3 py-1 text-xl font-black text-slate-900 border-b-2 border-slate-900 focus:outline-none w-40 bg-slate-50 rounded-t"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateNickname()}
                />
                <button 
                  onClick={handleUpdateNickname}
                  disabled={isUpdatingNickname}
                  className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  저장
                </button>
                <button 
                  onClick={() => { setIsEditingNickname(false); setEditNickname(userProfile?.nickname || ''); }}
                  className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-300"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingNickname(true)}>
                  {userProfile ? userProfile.nickname : '사용자'}
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </h1>
                {userProfile?.role === 'admin' && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">관리자</span>
                )}
              </>
            )}
          </div>
          <p className="text-slate-500 text-sm mb-4">
            가입일: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '알 수 없음'}
          </p>
          
          {/* 활동 요약 */}
          <div className="flex items-stretch justify-center md:justify-start gap-3">
            <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-center w-[90px] flex flex-col justify-center">
              <div className="text-[11px] font-bold text-slate-400 mb-1">작성한 글</div>
              <div className="text-xl font-black text-slate-800 leading-none">{myPosts.length}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-center w-[90px] flex flex-col justify-center">
              <div className="text-[11px] font-bold text-slate-400 mb-1">작성한 댓글</div>
              <div className="text-xl font-black text-slate-800 leading-none">{myComments.length}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-center w-[90px] flex flex-col justify-center">
              <div className="text-[11px] font-bold text-slate-400 mb-1">토론 전적</div>
              <div className="text-xs font-black text-slate-800 leading-tight break-keep">{userProfile?.debateRecord || '0승 0무 0패 (0.0%)'}</div>
            </div>
          </div>
        </div>

        {/* 계정 설정 */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-slate-500">대시보드 공개</span>
            <button 
              onClick={handleToggleVisibility}
              disabled={isUpdatingPublic}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-indigo-500' : 'bg-slate-300'} ${isUpdatingPublic ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
            >
              로그아웃
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors"
            >
              회원탈퇴
            </button>
          </div>
        </div>
      </section>

      {/* 2. 활동 영역 (탭) */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-2xl">📝</span> 활동
          </h2>
        </div>
        <div className="flex items-center gap-6 border-b border-slate-200 mb-6 pl-2 overflow-x-auto whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`pb-3 text-base md:text-lg font-black transition-colors relative ${activeTab === 'posts' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            내가 작성한 글
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`pb-3 text-base md:text-lg font-black transition-colors relative ${activeTab === 'comments' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            내가 작성한 댓글
            {activeTab === 'comments' && <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('debates')}
            className={`pb-3 text-base md:text-lg font-black transition-colors relative ${activeTab === 'debates' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            내 토론
            {activeTab === 'debates' && <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('watchedDebates')}
            className={`pb-3 text-base md:text-lg font-black transition-colors relative ${activeTab === 'watchedDebates' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            관전중인 토론
            {activeTab === 'watchedDebates' && <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {(() => {
            const activeData = activeTab === 'posts' ? myPosts : 
                               activeTab === 'comments' ? myComments : 
                               activeTab === 'debates' ? myDebates : myWatchedDebates;
            return (
              <ul className="divide-y divide-slate-100">
                {activeData.length > 0 ? activeData.map((item) => (
                  <li key={item.id}>
                    {item.isDisabled ? (
                      <div className="block px-6 py-5 opacity-40 grayscale cursor-not-allowed">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getActivityBadgeClass(item.boardName)}`}>{item.boardName}</span>
                          <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{item.title || item.content}</h3>
                      </div>
                    ) : (
                    <Link href={item.link} className="block px-6 py-5 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getActivityBadgeClass(item.boardName)}`}>{item.boardName}</span>
                        <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{item.title || item.content}</h3>
                    </Link>
                    )}
                  </li>
                )) : (
                  <li className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                    {activeTab === 'posts' ? '아직 작성한 글이 없습니다.' : 
                     activeTab === 'comments' ? '아직 작성한 댓글이 없습니다.' : 
                     activeTab === 'debates' ? '아직 참여중인 토론이 없습니다.' : '아직 관전중인 토론이 없습니다.'}
                  </li>
                )}
              </ul>
            );
          })()}
        </div>
      </section>

    </div>
  );
}

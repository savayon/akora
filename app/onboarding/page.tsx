"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userRepository } from '@/repositories';
import { useAppStore } from '@/store/useAppStore';
import { UserAvatar } from '@/components/UserBadge';

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAppStore();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 이미 온보딩이 끝난 유저는 접근 불가
  useEffect(() => {
    if (currentUser.isOnboarded && currentUser.id) {
      router.replace('/');
    }
  }, [currentUser.isOnboarded, currentUser.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (nickname.length > 20) {
      setError('닉네임은 20자 이내로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await userRepository.updateUserProfile(currentUser.id, {
        nickname: nickname.trim(),
        is_onboarded: true
      });

      // 로컬 상태 업데이트
      setCurrentUser({
        id: currentUser.id,
        name: nickname.trim(),
        role: currentUser.role,
        isOnboarded: true,
      });

      router.push('/');
    } catch (err: any) {
      setError(err.message || '닉네임 설정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-6">
          <UserAvatar uuid={currentUser.id} name={nickname || '사용자'} avatarUrl={currentUser.avatarUrl} size="w-16 h-16" iconSize="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 mb-2">반갑습니다!</h1>
        <p className="text-sm font-medium text-slate-500 mb-8">
          아고라에서 사용할 닉네임을 설정해주세요.<br />
          <span className="text-[12px] text-slate-400">닉네임은 언제든지 마이페이지에서 변경할 수 있습니다.</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="멋진 닉네임 입력"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-bold text-slate-800 transition-all placeholder:font-medium"
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '설정 중...' : '아고라 시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

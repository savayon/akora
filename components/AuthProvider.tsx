"use client";

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setCurrentUser, currentUser } = useAppStore();
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 초기 세션 확인
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // DB에서 role 조회
        const { data: profile } = await supabase
          .from('users')
          .select('id, nickname, role, is_onboarded, avatar_url')
          .eq('id', session.user.id)
          .single();

        setCurrentUser({
          id: session.user.id,
          name: profile?.nickname || session.user.user_metadata?.full_name || '사용자',
          role: (profile?.role === 'admin' ? 'admin' : 'user'),
          isOnboarded: profile?.is_onboarded ?? false,
          avatarUrl: profile?.avatar_url || null,
        });
      }
    };

    initAuth();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('id, nickname, role, is_onboarded, avatar_url')
            .eq('id', session.user.id)
            .single();

          setCurrentUser({
            id: session.user.id,
            name: profile?.nickname || session.user.user_metadata?.full_name || '사용자',
            role: (profile?.role === 'admin' ? 'admin' : 'user'),
            isOnboarded: profile?.is_onboarded ?? false,
            avatarUrl: profile?.avatar_url || null,
          });
        } else {
          // 로그아웃 시 초기화
          if (process.env.NODE_ENV !== 'development') {
             setCurrentUser({ id: '', name: '일반시민', role: 'user' });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setCurrentUser]);

  // 온보딩 리다이렉트 처리
  useEffect(() => {
    if (currentUser.id && !currentUser.isOnboarded && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [currentUser.id, currentUser.isOnboarded, pathname, router]);

  return <>{children}</>;
}

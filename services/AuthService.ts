import { createClient as createBrowserClient } from '@/utils/supabase/client';

/**
 * AuthService
 * 인증(Auth) 관련 로직을 전담하는 Service 계층입니다.
 * UI 계층에서는 supabase.auth에 직접 접근하지 않고 이 Service를 통해 인증을 처리합니다.
 */
export const AuthService = {
  async signInWithKakao(redirectTo?: string) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        scopes: 'profile_nickname profile_image',
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Kakao login error:', error);
      throw error;
    }
    return data;
  },

  async signOut() {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  async getCurrentSession(client?: any) {
    const supabase = client || createBrowserClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getCurrentUser(client?: any) {
    const supabase = client || createBrowserClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async refreshSession() {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }
};

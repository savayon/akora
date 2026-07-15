import { createClient as createServerClient } from '@/utils/supabase/server';

export const ServerAuthService = {
  async exchangeCodeForSession(code: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('exchangeCodeForSession Error:', error);
      throw error;
    }
    return data;
  }
};

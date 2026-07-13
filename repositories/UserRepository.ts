"use server";

import { createClient } from '@/utils/supabase/server'

export interface UserProfile {
  id: string
  nickname: string
  avatar_url: string
  created_at: string
}

export async function getCurrentUser(): Promise<UserProfile | null> {
    const supabase = await createClient()
    
    // 세션 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    // DB에서 사용자 프로필 정보 조회
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError || !profile) {
      // MVP: 사용자가 로그인했지만 users 테이블에 없으면 임시로 매핑 (또는 새로 생성 로직)
      return {
        id: user.id,
        nickname: user.user_metadata?.full_name || '사용자',
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString(),
      }
    }

    return profile
}

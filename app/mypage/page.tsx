import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/repositories/UserRepository';
import { userRepository } from '@/repositories';
import { createClient } from '@/utils/supabase/server';
import { MyPageClient } from './MyPageClient';

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const supabase = await createClient();

  // Fetch full user profile
  const { data: profileData } = await supabase
    .from('users')
    .select('id, nickname, avatar_url, created_at, is_public_profile')
    .eq('id', user.id)
    .single();

  const fullUserProfile = profileData ? {
    ...profileData,
    is_public_profile: profileData.is_public_profile !== false
  } : {
    id: user.id,
    nickname: user.nickname,
    avatar_url: null,
    created_at: new Date().toISOString(),
    is_public_profile: true
  };

  const { myPosts, myComments, myDebates } = await userRepository.getMyPageActivity(user.id, supabase);

  return (
    <MyPageClient 
      userProfile={fullUserProfile} 
      myPosts={myPosts} 
      myComments={myComments} 
      myDebates={myDebates}
    />
  );
}

import { redirect } from 'next/navigation';
import { userRepository } from '@/repositories';
import { AuthService } from '@/services';
import { MyPageClient } from './MyPageClient';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const user = await AuthService.getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // Fetch full user profile stats
  const userProfile = await userRepository.getProfileStats(user.id);
  const activity = await userRepository.getMyPageActivity(user.id);

  return (
    <MyPageClient 
      userProfile={userProfile} 
      myPosts={activity.myPosts} 
      myComments={activity.myComments} 
      myDebates={activity.myDebates}
      myWatchedDebates={activity.myWatchedDebates}
    />
  );
}

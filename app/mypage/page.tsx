import { redirect } from 'next/navigation';
import { userRepository } from '@/repositories';
import { AuthService } from '@/services';
import { DebateStatsService } from '@/services';
import { createClient } from '@/utils/supabase/server';
import { MyPageClient } from './MyPageClient';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/');
  }

  // Fetch full user profile stats
  const userProfile = await userRepository.getProfileStats(user.id, supabase);
  const activity = await userRepository.getMyPageActivity(user.id, supabase);
  const debateStats = await DebateStatsService.getUserDebateStats(user.id, supabase);

  return (
    <MyPageClient 
      userProfile={userProfile ? { ...userProfile, debateRecord: debateStats.record } : null}
      myPosts={activity.myPosts} 
      myComments={activity.myComments} 
      myDebates={activity.myDebates}
      myWatchedDebates={activity.myWatchedDebates}
    />
  );
}

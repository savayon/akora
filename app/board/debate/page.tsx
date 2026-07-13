import { createClient } from '@/utils/supabase/server';
import { formatRelativeTime } from '@/lib/formatTime';
import { DebateBoardClient } from './DebateBoardClient';

import { discussionRepository } from '@/repositories';

export const dynamic = 'force-dynamic';

export default async function DebateBoardPage() {
  const supabase = await createClient();
  const topics = await discussionRepository.getTopics(supabase);

  return <DebateBoardClient topics={topics} />;
}

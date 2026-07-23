import {
  SupabaseUserRepository, SupabasePostRepository, SupabaseCommentRepository,
  SupabaseDiscussionRepository, SupabaseProposalRepository, SupabaseDebateRepository,
  SupabaseTurnRepository, SupabaseNotificationRepository, SupabaseReportRepository,
  SupabaseSearchRepository, SupabaseJudgmentRepository, SupabasePreVoteRepository,
  matchRepository
} from './supabase';
import { debateCommentRepository as SupabaseDebateCommentRepository } from './supabase/DebateCommentRepository';

/**
 * Repository Layer 진입점.
 */

export const userRepository = SupabaseUserRepository;
export const postRepository = SupabasePostRepository;
export const commentRepository = SupabaseCommentRepository;
export const discussionRepository = SupabaseDiscussionRepository;
export const proposalRepository = SupabaseProposalRepository;
export const debateRepository = SupabaseDebateRepository;
export const turnRepository = SupabaseTurnRepository;
export const notificationRepository = SupabaseNotificationRepository;
export const reportRepository = SupabaseReportRepository;
export const debateCommentRepository = SupabaseDebateCommentRepository;
export const judgmentRepository = SupabaseJudgmentRepository;
export const preVoteRepository = SupabasePreVoteRepository;
export const searchRepository = SupabaseSearchRepository;
export const matchRepo = matchRepository;

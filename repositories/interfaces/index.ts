import { 
  Comment, BoardComment, Proposal, Debate, Turn, Notification, 
  Post, PostListItem, Report, ReportStatus, 
  DiscussionTopic, DiscussionComment,
  Judgment, JurorType
} from '@/types';

// ============================================================
// User
// ============================================================
export interface IUserRepository {
  getCurrentUser(): Promise<{ id: string; name: string; role: string; isPublicProfile?: boolean } | null>;
  getProfileStats(uuid: string, supabaseClient?: any): Promise<import('@/types').UserProfileStats | null>;
  updateProfileVisibility(uuid: string, isPublic: boolean, supabaseClient?: any): Promise<void>;
  updateUserProfile(uuid: string, data: { nickname?: string; is_onboarded?: boolean }, supabaseClient?: any): Promise<void>;
  getMyPageActivity(uuid: string, supabaseClient?: any): Promise<{ myPosts: any[], myComments: any[], myDebates: any[], myWatchedDebates: any[] }>;
  deleteAccount(supabaseClient?: any): Promise<void>;
}

// ============================================================
// Post (게시글)
// ============================================================
export interface IPostRepository {
  getPosts(boardType: 'free' | 'discuss', supabaseClient?: any): Promise<PostListItem[]>;
  getRecentPosts(boardType: 'free' | 'discuss', limit: number, supabaseClient?: any): Promise<PostListItem[]>;
  getPost(id: string, supabaseClient?: any): Promise<Post | null>;
  createPost(data: { board_type: 'free' | 'discuss'; title: string; content: string }, supabaseClient?: any): Promise<Post>;
  deletePost(id: string, supabaseClient?: any): Promise<void>;
  softDeletePost(id: string, reason: string, supabaseClient?: any): Promise<void>;
  incrementViews(id: string, supabaseClient?: any): Promise<void>;
  getPostLikeStatus(postId: string, userId: string): Promise<boolean>;
  togglePostLike(postId: string, userId: string): Promise<boolean>;
}

// ============================================================
// Comment (댓글)
// ============================================================
export interface ICommentRepository {
  getBoardComments(postId: string): Promise<BoardComment[]>;
  createComment(postId: string, content: string, parentId?: string, replyType?: string, targetUserId?: string): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  softDeleteComment(id: string, reason: string): Promise<void>;
  toggleLike(commentId: string, userId: string): Promise<boolean>;
}

// ============================================================
// Discussion (논제게시판)
// ============================================================
export interface IDiscussionRepository {
  getTopics(supabaseClient?: any): Promise<DiscussionTopic[]>;
  getRecentTopics(limit: number, supabaseClient?: any): Promise<DiscussionTopic[]>;
  getTopic(id: string, supabaseClient?: any): Promise<DiscussionTopic | null>;
  getComments(topicId: string, supabaseClient?: any): Promise<DiscussionComment[]>;
  createTopic(data: { title: string; stanceA: string; stanceB: string }, supabaseClient?: any): Promise<DiscussionTopic>;
  createComment(topicId: string, data: { content: string; stance: 'A' | 'B' }, supabaseClient?: any): Promise<DiscussionComment>;
  vote(topicId: string, stance: 'A' | 'B', supabaseClient?: any): Promise<void>;
  getUserVote(topicId: string, supabaseClient?: any): Promise<'A' | 'B' | null>;
  deleteTopic(id: string, supabaseClient?: any): Promise<void>;
  deleteUserComments(topicId: string, supabaseClient?: any): Promise<void>;
  softDeleteTopic(id: string, reason: string, supabaseClient?: any): Promise<void>;
  softDeleteDiscussionComment(id: string, reason: string, supabaseClient?: any): Promise<void>;
  toggleCommentLike(commentId: string | number, userId: string): Promise<boolean>;
}

// ============================================================
// Proposal (토론 제안)
// ============================================================
export interface IProposalRepository {
  createProposal(data: Partial<Proposal>): Promise<Proposal>;
  getPendingProposals(userId: string): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | null>;
  updateStatus(id: string, status: string): Promise<void>;
  toggleWatchProposal(proposalId: string | number, userId: string): Promise<{ isWatched: boolean; watchCount: number }>;
  getWatchStatus(proposalId: string | number, userId: string | undefined): Promise<{ isWatched: boolean; watchCount: number }>;
  migrateWatchersToFollowers(proposalId: string | number, debateId: string): Promise<string[]>;
}

// ============================================================
// Debate (토론)
// ============================================================
export interface IDebateRepository {
  getDebate(debateId: string, supabaseClient?: any): Promise<Debate | null>;
  getActiveDebates(supabaseClient?: any): Promise<Debate[]>;
  getRecentDebates(limit: number, supabaseClient?: any): Promise<Debate[]>;
  createDebate(data: Partial<Debate>, supabaseClient?: any): Promise<Debate>;
  updateStatus(debateId: string, status: string, supabaseClient?: any): Promise<void>;
  endDebate(debateId: string, supabaseClient?: any): Promise<boolean>;
  getDebateByProposalId(proposalId: string | number, supabaseClient?: any): Promise<Debate | null>;
  markAsTimeoutLoss(debateId: string, loserRole: 'proposer' | 'responder', supabaseClient?: any): Promise<boolean>;
  submitClaim(debateId: string, role: 'proposer' | 'responder', claim: string, supabaseClient?: any): Promise<void>;
  generateDebateTopic(debateId: string, proposerClaim: string, responderClaim: string, supabaseClient?: any): Promise<{ topic: string } | null>;
  updateDebateTopic(debateId: string, topic: string, supabaseClient?: any): Promise<void>;
  requestTopicChange(debateId: string, topic: string, supabaseClient?: any): Promise<{ recipientId: string }>;
  approveTopicChange(debateId: string, supabaseClient?: any): Promise<void>;
  rejectTopicChange(debateId: string, supabaseClient?: any): Promise<void>;
  getDisplayTopic(debate: Pick<Debate, 'topic' | 'topicStatus'>): string;
  markAsForfeitLoss(debateId: string, role: 'proposer' | 'responder' | 'both', supabaseClient?: any): Promise<boolean>;
  getDebateStatsData(userId: string, supabaseClient?: any): Promise<DebateStatsRawData>;
  closeDebateWithResult(debateId: string, winnerId: string, supabaseClient?: any): Promise<boolean>;
  getDebateNotificationRecipients(debateId: string, supabaseClient?: any): Promise<string[]>;
}

export interface DebateStatsRawData {
  debates: Array<{
    id: string;
    proposer_id: string;
    responder_id: string;
    status: string;
    ended_reason: 'timeout' | 'normal' | 'abandoned' | 'forfeit' | null;
    timeout_loser_role: 'proposer' | 'responder' | 'both' | null;
  }>;
  finalVotes: Array<{
    debate_id: string;
    stance: 'proposer' | 'responder';
  }>;
}

// ============================================================
// Turn (발언)
// ============================================================
export interface ITurnRepository {
  getTurns(debateId: string): Promise<Turn[]>;
  addTurn(debateId: string, turnData: Partial<Turn>): Promise<Turn>;
}

// ============================================================
// Notification (알림)
// ============================================================
export interface INotificationRepository {
  getUserNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  createNotification(userId: string, data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<Notification>;
  deleteNotification(notificationId: string): Promise<void>;
}

// ============================================================
// PreVote (사전투표)
// ============================================================
export interface IPreVoteRepository {
  submitPreVote(debateId: string, userId: string, stance: 'proposer' | 'responder', supabaseClient?: any): Promise<void>;
  getUserPreVote(debateId: string, userId: string, supabaseClient?: any): Promise<'proposer' | 'responder' | null>;
  getPreVoteStats(debateId: string, supabaseClient?: any): Promise<{ proposer: number; responder: number; total: number }>;
  getAllPreVotesMap(debateId: string, supabaseClient?: any): Promise<Map<string, 'proposer' | 'responder'>>;
}

// ============================================================
// Judgment (배심원 판정)
// ============================================================
export interface IJudgmentRepository {
  submitJudgment(
    debateId: string, 
    jurorId: string | null, 
    jurorType: JurorType, 
    votedForId: string, 
    reason: string,
    supabaseClient?: any
  ): Promise<boolean>;

  getJudgments(debateId: string, supabaseClient?: any): Promise<{
    judgments: Judgment[];
    currentCount: number;
    requiredCount: number;
  }>;
  
  hasUserJudged(debateId: string, userId: string, supabaseClient?: any): Promise<boolean>;
}

// ============================================================
// Report (신고)
// ============================================================
export interface IReportRepository {
  createReport(data: { targetType: 'post' | 'comment'; targetId: string; reason: string; detail?: string }): Promise<Report>;
  getReports(): Promise<Report[]>;
  updateStatus(id: string, status: ReportStatus): Promise<void>;
  hideTarget(type: 'post' | 'comment', id: string): Promise<void>;
}

// ============================================================
// Search (통합 검색)
// ============================================================
import type { SearchResultItem } from '@/types';

export interface ISearchRepository {
  searchPosts(keyword: string, supabaseClient?: any): Promise<SearchResultItem[]>;
  searchDiscussions(keyword: string, supabaseClient?: any): Promise<SearchResultItem[]>;
  searchDebates(keyword: string, supabaseClient?: any): Promise<SearchResultItem[]>;
  searchAll(keyword: string, supabaseClient?: any): Promise<SearchResultItem[]>;
}

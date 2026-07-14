import { 
  Comment, BoardComment, Proposal, Debate, Turn, Notification, 
  Post, PostListItem, Report, ReportStatus, 
  DiscussionTopic, DiscussionComment 
} from '@/types';

// ============================================================
// User
// ============================================================
export interface IUserRepository {
  getCurrentUser(): Promise<{ id: string; name: string; role: string; isPublicProfile?: boolean } | null>;
  getProfileStats(uuid: string, supabaseClient?: any): Promise<import('@/types').UserProfileStats | null>;
  updateProfileVisibility(uuid: string, isPublic: boolean, supabaseClient?: any): Promise<void>;
  getMyPageActivity(uuid: string, supabaseClient?: any): Promise<{ myPosts: any[], myComments: any[], myDebates: any[] }>;
  deleteAccount(supabaseClient?: any): Promise<void>;
}

// ============================================================
// Post (게시글)
// ============================================================
export interface IPostRepository {
  getPosts(boardType: 'free' | 'discuss', supabaseClient?: any): Promise<PostListItem[]>;
  getPost(id: string, supabaseClient?: any): Promise<Post | null>;
  createPost(data: { board_type: 'free' | 'discuss'; title: string; content: string }, supabaseClient?: any): Promise<Post>;
  deletePost(id: string, supabaseClient?: any): Promise<void>;
  softDeletePost(id: string, reason: string, supabaseClient?: any): Promise<void>;
  incrementViews(id: string, supabaseClient?: any): Promise<void>;
}

// ============================================================
// Comment (댓글)
// ============================================================
export interface ICommentRepository {
  getBoardComments(postId: string): Promise<BoardComment[]>;
  createComment(postId: string, content: string, parentId?: string, replyType?: string, targetUserId?: string): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  softDeleteComment(id: string, reason: string): Promise<void>;
}

// ============================================================
// Discussion (논제게시판)
// ============================================================
export interface IDiscussionRepository {
  getTopics(supabaseClient?: any): Promise<DiscussionTopic[]>;
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
}

// ============================================================
// Proposal (토론 제안)
// ============================================================
export interface IProposalRepository {
  createProposal(data: Partial<Proposal>): Promise<Proposal>;
  getPendingProposals(userId: string): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | null>;
  updateStatus(id: string, status: string): Promise<void>;
}

// ============================================================
// Debate (토론)
// ============================================================
export interface IDebateRepository {
  getDebate(debateId: string): Promise<Debate | null>;
  getActiveDebates(): Promise<Debate[]>;
  createDebate(data: Partial<Debate>): Promise<Debate>;
  updateStatus(debateId: string, status: string): Promise<void>;
  submitVote(debateId: string, userId: string, stance: 'proposer' | 'responder'): Promise<void>;
  getVoteStats(debateId: string): Promise<{ proposer: number; responder: number }>;
  getUserVote(debateId: string, userId: string): Promise<'proposer' | 'responder' | null>;
  getDebateByProposalId(proposalId: string | number): Promise<Debate | null>;
  markAsTimeoutLoss(debateId: string, loserRole: 'proposer' | 'responder'): Promise<boolean>;
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

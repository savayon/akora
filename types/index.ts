/**
 * 아고라 도메인 모델 (Domain Model)
 *
 * 이 파일은 프로젝트 전체에서 사용하는 핵심 도메인 타입을 정의합니다.
 * 도메인 용어의 정의는 docs/domain-model.md를 참고하세요.
 */

// ============================================================
// 0. Post (게시글) — 자유게시판, 토의게시판 통합
// ============================================================
export interface Post {
  id: string;
  board_type: 'free' | 'discuss';
  author_id: string;
  author_name: string; // users JOIN 결과
  author_avatar_url?: string | null;
  title: string;
  content: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  is_hidden: boolean;
  has_active_debates: boolean;
  created_at: string;
  deletedAt?: string | null;
  deletedReason?: string | null;
}

// ============================================================
// 1. Comment (댓글) — 순수 도메인 객체
// ============================================================
export interface Comment {
  id: string | number;
  author: string;
  authorId?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  likes: number;
  createdAt: string; // 표시용 시각 문자열 (예: '10:35', '2026.06.23')
  deletedAt?: string | null;
  deletedReason?: string | null;
}

// ============================================================
// 2. Proposal (토론 제안) — 정식 도메인 객체
// ============================================================
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Proposal {
  id: string | number;
  sourceType: 'comment' | 'post';
  sourceId: string | number;
  postId?: string | number;
  proposerId?: string;
  targetId?: string;
  proposerName: string;
  targetName: string;
  proposerAvatarUrl?: string | null;
  targetAvatarUrl?: string | null;
  topic: string;
  claim: string;
  excerpt: string; // 인용된 원문
  status: ProposalStatus;
  createdAt?: string;
}

// ============================================================
// 3. Debate (토론) — 토론 세션 메타 정보
// ============================================================
export type DebateStatus = 'preparing' | 'in_progress' | 'judging' | 'completed';
export type DebateTopicStatus = 'waiting' | 'generating' | 'completed' | 'failed';

export interface Debate {
  id: string | number;
  topic: string;
  topicStatus?: DebateTopicStatus | null;
  proposerId?: string;
  responderId?: string;
  proposerName: string;
  responderName: string;
  proposerAvatarUrl?: string | null;
  responderAvatarUrl?: string | null;
  originType: string;
  originPreview: string;
  originUrl: string;
  round: number;
  status: DebateStatus;
  endedReason?: 'timeout' | 'normal' | 'abandoned' | 'forfeit';
  timeoutLoserRole?: 'proposer' | 'responder' | 'both';
  judgingEndsAt?: string | null;
  proposerClaim?: string | null;
  responderClaim?: string | null;
  proposerTopicEditCount?: number;
  responderTopicEditCount?: number;
  pendingTopic?: string | null;
  topicChangeRequesterId?: string | null;
  createdAt?: string;
  spectatorCount?: number;
  requiredJurors?: number; // 배심원 필요 수 (기본값: 5)
  winnerId?: string | null; // 최종 승리한 참가자 ID
}

// ============================================================
// 3.5. Judgment (판정)
// ============================================================
export type JurorType = 'human' | 'ai' | 'expert';

export interface Judgment {
  id: string;
  debateId: string | number;
  jurorId: string | null;
  jurorType: JurorType;
  votedForId: string;
  reason: string;
  createdAt: string;
}

// ============================================================
// 4. Turn (발언) — 토론의 최소 단위
// ============================================================
export interface Turn {
  id: string | number;
  turnNum: number;
  authorRole: 'proposer' | 'responder';
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  time: string;
  quotedTurnId?: string | number;    // 인용 대상 Turn의 ID
  quotedExcerpt?: string;   // 인용된 텍스트 조각
  quotedAuthorName?: string; // 인용된 발언자 이름
  quotedTurnNum?: number;    // 인용된 라운드 번호
  createdAt: string;         // Raw ISO string for countdowns
}

// ============================================================
// 5. Notification (알림)
// ============================================================
export type NotificationType = 'proposal_received' | 'turn_arrived' | 'debate_ended' | 'topic_change_requested';

export interface Notification {
  id: string | number;
  type: NotificationType;
  icon: string;
  message: string;
  subtext?: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================================
// ViewModel: 특정 화면에서 도메인 객체를 확장한 뷰 전용 타입
// ============================================================

/** 자유게시판 댓글 목록에서 사용하는 확장 타입 */
export interface BoardComment extends Comment {
  replyType?: 'normal' | 'proposal' | 'system' | 'moderator';
  targetUserId?: string | number;
  targetUserName?: string;
  watchCount?: number;
  replies?: BoardComment[];
  hasDebate?: boolean;
  debateId?: string | number;
  debateStatus?: 'active' | 'pending' | 'rejected' | 'expired' | 'none';
  proposalId?: string | number;
}

// ============================================================
// 보조 타입: UI 전용 / 일회성
// ============================================================

/** 페이지 간 컨텍스트를 잠시 전달하기 위한 임시 셔틀 (도메인 객체 아님) */
export interface DraftDebate {
  sourceType: 'comment' | 'post';
  sourceId: string | number;
  author: string;
  excerpt: string;
  topic: string;
  claim: string;
}

/** 토론방에서 텍스트 드래그 시 나타나는 부분 인용 팝업 */
export type SelectionPopup = {
  x: number;
  y: number;
  text: string;
  turnId: string | number;
  turnNum: number;
  authorName: string;
} | null;

// ============================================================
// 목록 카드 표시용 타입 (메인 페이지, 토론 광장 등)
// ============================================================
export interface DebateCard {
  id: number;
  tag: string;
  tagColor: string;
  title: string;
  claimA: string;
  nickA: string;
  avatarA?: string | null;
  claimB: string;
  nickB: string;
  avatarB?: string | null;
  hearts: number;
  turns: number;
}

export interface TopicCard {
  title: string;
  creator: string;
  claimA: string;
  claimB: string;
  participants: number;
}

// ============================================================
// Discussion (논제게시판) 관련 타입
// ============================================================


// ============================================================
// 10. Report (신고)
// ============================================================
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string | number;
  targetType: 'post' | 'comment';
  targetId: string | number;
  reporterId: string;
  reason: string;
  detail?: string;
  createdAt: string;
  status: ReportStatus;
}

export interface DiscussionTopic {
  id: string | number;
  title: string;
  author: string;
  authorId?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
  stanceA: string;
  stanceB: string;
  votesA: number;
  votesB: number;
  deletedAt?: string | null;
  deletedReason?: string | null;
}

export interface DiscussionComment {
  id: string | number;
  author: string;
  authorId?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  stance: 'A' | 'B';
  createdAt: string;
  likes: number;
  deletedAt?: string | null;
  deletedReason?: string | null;
}

// ============================================================
// 게시글 목록 아이템 (게시판 목록 표시용)
// ============================================================
export interface PostListItem {
  id: string | number;
  title: string;
  author: string;
  authorId?: string | null;
  authorAvatarUrl?: string | null;
  date: string;
  views: number;
  likes: number;
  comments: number;
  isDebating?: boolean;
  deletedAt?: string | null;
}

// ============================================================
// 유저 프로필 및 통계 정보
// ============================================================
export interface User {
  id: string;
  name: string;
  role: string;
  isOnboarded?: boolean;
  isPublicProfile?: boolean;
}

export interface UserProfileStats {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  role: string;
  isPublic: boolean;
  createdAt: string;
  postCount: number;
  commentCount: number;
  debateRecord: string;
  persuasionCount?: number;
}

// ============================================================
// Search (통합 검색)
// ============================================================
export type SearchDomain = 'free' | 'discuss' | 'debate';

export enum SearchSort {
  Latest = 'created_at',
  Accuracy = 'score'
}

export interface SearchResultItem {
  id: string | number;
  domain: SearchDomain;
  title: string;
  contentPreview: string;
  authorName: string;
  createdAt: string;
  url: string;
  matchedField?: string;
  score?: number;
}

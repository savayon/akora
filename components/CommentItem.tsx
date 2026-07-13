import React, { useState } from 'react';
import Link from 'next/link';
import { UserBadge } from '@/components/UserBadge';
import { ThumbUpIcon, ReplyIcon } from '@/components/icons';
import { Comment, BoardComment } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { commentRepository } from '@/repositories';

type CommentItemProps = {
  comment: Comment | BoardComment;
  variant?: 'default' | 'compact';
  isBest?: boolean;
  isTopBestCard?: boolean;
  role?: 'proposer' | 'responder' | 'viewer';
  onReply?: (commentId: string | number) => void;
  onProposeDebate?: (commentId: string | number, author: string, content: string) => void;
  onSubmitReply?: (commentId: string | number, content: string, isProposal: boolean) => void;
  children?: React.ReactNode;
  isDiscussBoard?: boolean;
  postAuthorId?: string;
};

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  variant = 'default',
  isBest = false,
  isTopBestCard = false,
  role = 'viewer',
  onReply,
  onProposeDebate,
  onSubmitReply,
  children,
  isDiscussBoard = false,
  postAuthorId
}) => {
  const isBoardComment = 'replyType' in comment || 'hasDebate' in comment;
  const boardComment = isBoardComment ? (comment as BoardComment) : null;
  const isProposal = boardComment?.replyType === 'proposal';
  
  const [watchCount, setWatchCount] = useState(boardComment?.watchCount || 0);
  const [isWatched, setIsWatched] = useState(false);
  const [localLikes, setLocalLikes] = useState(comment.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isProposalMode, setIsProposalMode] = useState(false);
  
  const { currentUser, openReportModal, setIsLoginModalOpen } = useAppStore();

  const handleToggleLike = () => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isProposal) return;
    if (isLiked) {
      setLocalLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLocalLikes(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const handleToggleWatch = () => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isWatched) {
      setWatchCount(prev => Math.max(0, prev - 1));
      setIsWatched(false);
    } else {
      setWatchCount(prev => prev + 1);
      setIsWatched(true);
    }
  };

  const handleReplySubmit = () => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!replyText.trim() || !onSubmitReply) return;
    if (onSubmitReply) {
      onSubmitReply(comment.id, replyText, isProposalMode);
    }
    setIsReplying(false); 
    setReplyText(''); 
    setIsProposalMode(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      try {
        if (currentUser.role === 'admin' && currentUser.id !== comment.authorId) {
          const reason = prompt('관리자 권한으로 삭제합니다. 사유를 입력해주세요:');
          if (reason === null) return; // 취소
          await commentRepository.softDeleteComment(String(comment.id), reason);
        } else {
          await commentRepository.softDeleteComment(String(comment.id), '');
        }
        
        alert('삭제되었습니다.');
        window.location.reload();
      } catch (e: any) {
        alert(e.message || '삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleReplySubmit();
    }
  };


  const scrollToOriginal = () => {
    if (isTopBestCard) {
      document.getElementById(`original-comment-${comment.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // highlight the original comment momentarily
      const original = document.getElementById(`original-comment-${comment.id}`);
      if (original) {
        const innerContent = original.firstElementChild;
        if (innerContent) {
          innerContent.classList.add('ring-2', 'ring-yellow-400', 'transition-all', 'duration-500');
          setTimeout(() => {
            innerContent.classList.remove('ring-2', 'ring-yellow-400');
          }, 1000);
        }
      }
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const hasReplies = boardComment?.replies && boardComment.replies.length > 0;

  if (comment.deletedAt && !hasReplies && !isAdmin) {
    return null;
  }
  
  const isVisuallyDeleted = comment.deletedAt && !isAdmin;

  return (
    <div 
      className={`flex flex-col ${isTopBestCard ? 'cursor-pointer hover:opacity-90 transition-opacity relative mb-4' : 'relative'}`}
      id={!isTopBestCard ? `original-comment-${comment.id}` : undefined}
      onClick={isTopBestCard ? scrollToOriginal : undefined}
    >
      {isBest && (
        <div className="absolute -left-1 -top-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 font-black text-[10px] rounded shadow-sm z-10 flex items-center gap-1">
          🔥 BEST
        </div>
      )}
      <div className={`${variant === 'compact' ? 'p-3.5' : 'p-5'} rounded-xl border bg-white transition-all duration-500 ${isBest ? 'border-yellow-200' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <UserBadge 
              name={isVisuallyDeleted ? '(알 수 없음)' : comment.author} 
              uuid={isVisuallyDeleted ? null : comment.authorId} 
              avatarUrl={isVisuallyDeleted ? null : comment.authorAvatarUrl}
              size={variant === 'compact' ? "w-6 h-6" : "w-8 h-8"} 
              iconSize={variant === 'compact' ? "w-4 h-4" : "w-5 h-5"} 
              containerClass="border border-slate-200 shrink-0" 
              textClass={`font-bold text-slate-800 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`} 
            />
            {postAuthorId && comment.authorId === postAuthorId && !isVisuallyDeleted && (
              <span className="bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-wide shrink-0">
                글쓴이
              </span>
            )}
          </div>
          <span className={`${variant === 'compact' ? 'text-[10px]' : 'text-xs'} font-medium text-slate-400 shrink-0`}>{comment.createdAt}</span>
          
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {currentUser?.role === 'admin' && !comment.deletedAt && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  const reason = prompt('관리자 권한으로 이 댓글을 숨김/삭제 처리합니다.\n삭제 이유를 입력해주세요:');
                  if (reason) {
                    try {
                      await commentRepository.softDeleteComment(comment.id as string, reason);
                      alert('삭제 처리되었습니다.');
                      window.location.reload();
                    } catch (err) {
                      alert('오류가 발생했습니다.');
                    }
                  }
                }}
                className="text-[10px] text-red-500 hover:text-red-700 transition-colors font-bold"
              >
                🛡️ 숨기기 (관리자)
              </button>
            )}
            {(currentUser.id === comment.authorId || currentUser.role === 'admin') && (
              <button 
                onClick={handleDelete}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                title="삭제"
              >
                🗑️
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openReportModal('comment', comment.id);
              }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              title="신고"
            >
              🚨
            </button>
          </div>
        </div>
        
        {isProposal && boardComment?.targetUserName && (
          <div className="flex items-center gap-1.5 mt-2 mb-1 text-sm">
            <span className="font-bold text-slate-700">{comment.author}</span>
            <span className="text-slate-500">님이</span>
            <span className="font-bold text-slate-700">{boardComment.targetUserName}</span>
            <span className="text-slate-500">님에게</span>
          </div>
        )}
        
        {comment.deletedAt ? (
          <div className="my-3 flex flex-col gap-1 p-3 bg-slate-50 rounded-lg">
            <span className="font-bold text-slate-500 text-sm">
              삭제된 댓글입니다. {isAdmin && <span className="text-red-500 text-xs ml-2 font-black">(관리자 모드: 원본 표시중)</span>}
            </span>
            {comment.deletedReason && comment.deletedReason !== '사용자 본인 또는 관리자가 삭제함' && (
              <span className="text-xs text-slate-400">삭제된 이유: {comment.deletedReason}</span>
            )}
            {isAdmin && (
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mt-2 p-3 bg-white border border-slate-200 rounded-md">
                {comment.content}
              </p>
            )}
          </div>
        ) : (
          <p className={`text-slate-700 ${variant === 'compact' ? 'text-xs my-2' : 'text-sm md:text-base my-3'} leading-relaxed break-words whitespace-pre-wrap`}>
            {isProposal && (
              <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-black text-xs mr-2 mb-1">
                토론을 제안했습니다!
              </span>
            )}
            {comment.content}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-2">
          {!isDiscussBoard && (
            <button 
              onClick={() => {
                if (!currentUser.id) {
                  setIsLoginModalOpen(true);
                  return;
                }
                setIsReplying(!isReplying);
              }}
              className={`flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer ${isReplying ? 'text-slate-900' : ''}`}
            >
              <ReplyIcon className="w-4 h-4" /> 답글
            </button>
          )}

          <button 
            disabled={isProposal}
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 transition-colors ${isProposal ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500 cursor-pointer'} ${isLiked ? 'text-blue-500' : ''}`}
          >
            <ThumbUpIcon className="w-4 h-4" /> {isProposal ? '-' : localLikes}
          </button>

          {/* 토론 제안 버튼 */}
          {!isProposal && currentUser?.id !== comment.authorId && !comment.deletedAt && !isTopBestCard && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onProposeDebate) {
                  onProposeDebate(comment.id, comment.author, comment.content);
                } else {
                  if (!currentUser?.id) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  setIsReplying(true);
                  setIsProposalMode(true);
                }
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 ml-auto"
            >
              <span>📖</span> 토론 제안하기
            </button>
          )}
          
          {isProposal && (!boardComment?.debateStatus || boardComment.debateStatus === 'pending' || boardComment.debateStatus === 'none') && (
            <button 
              onClick={handleToggleWatch}
              className={`ml-auto px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 cursor-pointer ${isWatched ? 'bg-yellow-400 text-slate-900' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'}`}
            >
              🙋 보고싶어요! {watchCount > 0 && <span className="font-black">{watchCount}</span>}
            </button>
          )}
          
          {isProposal && boardComment?.debateStatus === 'active' && (
            <Link href={`/debate/live/${boardComment?.debateId}`} className="ml-auto bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 font-bold cursor-pointer">
              📖 관전하기
            </Link>
          )}

          {isProposal && boardComment?.debateStatus === 'rejected' && (
            <div className="ml-auto bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 font-medium cursor-not-allowed">
              ❌ 거절됨
            </div>
          )}

          {isProposal && boardComment?.debateStatus === 'expired' && (
            <div className="ml-auto bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 font-medium cursor-not-allowed">
              ⏰ 만료됨
            </div>
          )}
        </div>
        
        {isReplying && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {isProposalMode && (
              <div className="mb-2 text-sm text-slate-700">
                <span className="font-bold">{currentUser.name}</span>님이 <span className="font-bold">{comment.author}</span>님에게
                <div className="mt-1 mb-2">
                  <span className="inline-block bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-xs mr-2">토론을 제안했습니다!</span>
                </div>
              </div>
            )}
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="답글을 남겨주세요. (Enter를 눌러 등록)"
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-yellow-400 resize-none min-h-[100px]"
            />
            <div className="flex justify-between items-center mt-3">
              <button 
                onClick={() => setIsProposalMode(!isProposalMode)}
                className={`text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                  isProposalMode 
                    ? 'bg-purple-600 text-white border border-purple-600 hover:bg-purple-700' 
                    : 'text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <span>📖</span> 토론 제안하기
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsReplying(false);
                    setIsProposalMode(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1.5 cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={handleReplySubmit}
                  className="text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      {children}
    </div>
  );
};

import React, { useState } from 'react';
import { DiscussionComment } from '@/types';
import { UserBadge } from './UserBadge';
import { ThumbUpIcon } from '@/components/icons';
import { useAppStore } from '@/store/useAppStore';
import { discussionRepository } from '@/repositories';
import { ContentRenderer } from '@/components/ContentRenderer';

interface Props {
  comment: DiscussionComment;
  isBest?: boolean;
  topicAuthorId?: string;
}

export const DiscussionCommentItem: React.FC<Props> = ({ comment, isBest, topicAuthorId }) => {
  const { currentUser, openReportModal, setIsLoginModalOpen } = useAppStore();
  
  const [localLikes, setLocalLikes] = useState(comment.likes);
  const [isLiked, setIsLiked] = useState(false);

  const handleToggleLike = () => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isLiked) {
      setLocalLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLocalLikes(prev => prev + 1);
      setIsLiked(true);
    }
  };

  return (
    <div className="flex flex-col mb-3 relative">
      {isBest && (
        <div className="absolute -left-1 -top-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 font-black text-[10px] rounded shadow-sm z-10 flex items-center gap-1">
          🔥 BEST
        </div>
      )}
      <div className={`p-5 rounded-xl border bg-white shadow-sm transition-colors ${comment.stance === 'A' ? (isBest ? 'border-yellow-400 bg-blue-50/20 shadow-md' : 'border-blue-200 bg-blue-50/10') : (isBest ? 'border-yellow-400 bg-orange-50/20 shadow-md' : 'border-orange-200 bg-orange-50/10')}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <UserBadge 
              name={comment.author} 
              uuid={comment.authorId}
              avatarUrl={comment.authorAvatarUrl}
              size="w-8 h-8" 
              iconSize="w-5 h-5" 
              containerClass={comment.stance === 'A' ? 'bg-blue-100 border border-blue-200' : 'bg-orange-100 border border-orange-200'} 
              textClass="font-bold text-slate-800 text-sm" 
            />
            {topicAuthorId && comment.authorId === topicAuthorId && !comment.deletedAt && (
              <span className="bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-wide shrink-0">
                글쓴이
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-slate-400 ml-2">{comment.createdAt}</span>
          
          <div className="ml-auto flex items-center gap-2">
            {currentUser?.role === 'admin' && !comment.deletedAt && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  const reason = prompt('관리자 권한으로 이 의견을 숨김/삭제 처리합니다.\n삭제 이유를 입력해주세요:');
                  if (reason) {
                    try {
                      await discussionRepository.softDeleteDiscussionComment(comment.id as string, reason);
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
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openReportModal('comment', comment.id);
              }}
              className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-bold"
            >
              🚨 신고
            </button>
          </div>
        </div>
        
        {comment.deletedAt ? (
          <div className="my-3 flex flex-col gap-1 p-3 bg-slate-50 rounded-lg">
            <span className="font-bold text-red-500 text-sm">삭제된 의견입니다.</span>
            <span className="text-xs text-slate-500">삭제된 이유: {comment.deletedReason || '사유 없음'}</span>
          </div>
        ) : (
          <div className="text-slate-700 text-sm md:text-base leading-relaxed my-3">
            <ContentRenderer content={comment.content} />
          </div>
        )}

        <div className="flex items-center justify-end gap-4 text-xs font-bold text-slate-500 mt-2">
          <button 
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${isLiked ? 'text-blue-500' : 'hover:text-blue-500'}`}
          >
            <ThumbUpIcon className="w-4 h-4" /> {localLikes}
          </button>
        </div>
      </div>
    </div>
  );
};

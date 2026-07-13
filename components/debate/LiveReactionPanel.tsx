import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Comment } from '@/types';
import { CommentItem } from '@/components/CommentItem';
import { useAppStore } from '@/store/useAppStore';
import { debateCommentRepository } from '@/repositories';

type LiveReactionPanelProps = {
  debateId: string;
  isFullView: boolean;
  role: 'proposer' | 'responder' | 'viewer';
  comments: Comment[];
  voteStats: { proposer: number; responder: number };
  onCommentAdded: (comment: Comment) => void;
};

export const LiveReactionPanel: React.FC<LiveReactionPanelProps> = ({ debateId, isFullView, role, comments, voteStats, onCommentAdded }) => {
  const { currentUser, setIsLoginModalOpen } = useAppStore();
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isFullView) return null;

  const totalComments = comments.length;
  let maxBestCount = 0;
  if (totalComments >= 9) maxBestCount = 3;
  else if (totalComments >= 5) maxBestCount = 2;
  else if (totalComments >= 1) maxBestCount = 1;

  const bestComments = [...comments]
    .filter(c => c.likes >= 10)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, maxBestCount);

  return (
    <div className="lg:col-span-1 flex flex-col max-h-[600px] lg:max-h-[calc(100vh-120px)] h-fit lg:sticky lg:top-24 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <span>💬</span> 관전자 반응
        </h3>
        <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{voteStats.proposer + voteStats.responder}명 참여중</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {bestComments.length > 0 && (
          <div className="space-y-2 mb-6 relative">
            <div className="absolute -left-4 -top-2 w-1.5 h-6 bg-yellow-400 rounded-r"></div>
            <h4 className="text-xs font-black text-yellow-600 mb-2">🔥 베스트 반응</h4>
            {bestComments.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                role={role} 
                isBest={true} 
                isTopBestCard={true}
                variant="compact"
                onProposeDebate={(commentId, author, content) => {
                  if (!currentUser?.id) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  if (confirm(`'${author}'님에게 1:1 토론을 제안하시겠습니까?`)) {
                    // Navigate to a dedicated page or show modal
                    // For now, we route to debate create page with query params
                    router.push(`/board/debate/create?targetName=${encodeURIComponent(author)}&sourceType=comment&sourceId=${commentId}`);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* 실시간 댓글 스트림 */}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <h4 className="text-xs font-black text-slate-400 mb-2">최신 반응</h4>
          {[...comments].sort((a, b) => Number(b.id) - Number(a.id)).map(comment => {
            const isBest = bestComments.some(c => c.id === comment.id);
            return (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                role={role} 
                isBest={isBest} 
                variant="compact"
                onProposeDebate={(commentId, author, content) => {
                  if (!currentUser?.id) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  if (confirm(`'${author}'님에게 1:1 토론을 제안하시겠습니까?`)) {
                    router.push(`/board/debate/create?targetName=${encodeURIComponent(author)}&sourceType=comment&sourceId=${commentId}`);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
      {/* 댓글 입력창 */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form 
          className="flex items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!currentUser.id) {
              setIsLoginModalOpen(true);
              return;
            }
            if (role !== 'viewer') {
              alert('토론 당사자는 관전자 반응을 남길 수 없습니다.');
              return;
            }
            if (!inputValue.trim() || isSubmitting) return;
            
            setIsSubmitting(true);
            try {
              const newComment = await debateCommentRepository.createComment(
                debateId, 
                currentUser.id, 
                inputValue.trim()
              );
              onCommentAdded(newComment);
              setInputValue('');
            } catch (err: any) {
              console.error(err);
              alert('댓글 등록에 실패했습니다: ' + err.message);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <input 
            type="text" 
            placeholder={role !== 'viewer' ? "토론 당사자는 관전자 반응을 남길 수 없습니다." : "토론에 대한 의견을 남겨주세요"}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-shadow disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSubmitting || role !== 'viewer'}
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isSubmitting || role !== 'viewer'}
            className="bg-slate-900 text-white font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '...' : '등록'}
          </button>
        </form>
      </div>
    </div>
  );
};

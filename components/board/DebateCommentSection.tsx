import React from 'react';
import { DiscussionCommentItem } from '@/components/DiscussionCommentItem';
import type { DiscussionComment } from '@/types';

type DebateCommentSectionProps = {
  userStance: 'A' | 'B' | null;
  newComment: string;
  setNewComment: (val: string) => void;
  handleAddComment: () => void;
  isSubmitting: boolean;
  bestCommentsA: DiscussionComment[];
  commentsA: DiscussionComment[];
  bestCommentsB: DiscussionComment[];
  commentsB: DiscussionComment[];
  topicAuthorId: string;
};

export function DebateCommentSection({
  userStance,
  newComment,
  setNewComment,
  handleAddComment,
  isSubmitting,
  bestCommentsA,
  commentsA,
  bestCommentsB,
  commentsB,
  topicAuthorId
}: DebateCommentSectionProps) {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="relative mt-8">
      {!userStance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/30 backdrop-blur-[2px]">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 mx-4 border border-slate-700/50">
            <span className="text-4xl">👀</span>
            <p className="font-black text-lg">어느 진영에 동의하시나요?</p>
            <p className="text-sm font-medium text-slate-300">투표 후 양측의 자세한 의견을 확인하고 토론에 참여해보세요.</p>
            <button 
              onClick={() => document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-2 bg-white text-slate-900 hover:bg-slate-200 font-bold py-2 px-6 rounded-full transition-colors text-sm shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              투표하러 가기
            </button>
          </div>
        </div>
      )}
      
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-start transition-all duration-500 ${!userStance ? 'blur-[4px] grayscale-[50%] opacity-40 pointer-events-none select-none' : ''}`}>
        
        {/* 왼쪽: 주장 A 의견 */}
        <div className={`flex flex-col gap-4 ${userStance === 'B' ? 'opacity-60 grayscale-[30%]' : ''}`}>
          <div className="bg-blue-600 text-white p-3 rounded-xl font-black text-center shadow-sm sticky top-4 z-10">
            주장 A 의견 공간
          </div>
          
          {userStance === 'A' ? (
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-3">
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="주장 A를 지지하는 의견을 작성해주세요. (Enter를 눌러 등록)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white resize-none h-24"
              />
              <button disabled={isSubmitting} onClick={handleAddComment} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors self-end disabled:opacity-50">
                {isSubmitting ? '등록 중...' : '의견 등록'}
              </button>
            </div>
          ) : (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <textarea 
                disabled
                placeholder="다른 진영에 투표하여 잠금 처리되었습니다."
                className="w-full bg-slate-200 border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 cursor-not-allowed text-slate-500 font-bold"
              />
              <button disabled className="bg-slate-400 text-white font-bold py-2 px-4 rounded-lg text-sm self-end cursor-not-allowed">
                잠금됨
              </button>
            </div>
          )}
          
          <div className="flex flex-col">
            {bestCommentsA.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-black text-blue-700 mb-3 flex items-center gap-1.5"><span className="text-lg">🔥</span> 베스트 의견</h4>
                <div className="flex flex-col gap-1">
                  {bestCommentsA.map(comment => (
                    <DiscussionCommentItem key={`best-${comment.id}`} comment={comment} isBest={true} topicAuthorId={topicAuthorId} />
                  ))}
                </div>
              </div>
            )}
            
            {commentsA.length > 0 && (
              <>
                {bestCommentsA.length > 0 && <h4 className="text-xs font-black text-slate-400 mb-3 border-t border-slate-100 pt-4">최신 의견</h4>}
                {commentsA.map(comment => {
                  const isBest = bestCommentsA.some(c => c.id === comment.id);
                  return <DiscussionCommentItem key={comment.id} comment={comment} isBest={isBest} topicAuthorId={topicAuthorId} />;
                })}
              </>
            )}
            
            {commentsA.length === 0 && (
              <div className="text-center text-slate-400 py-10 font-medium">아직 등록된 의견이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 오른쪽: 주장 B 의견 */}
        <div className={`flex flex-col gap-4 ${userStance === 'A' ? 'opacity-60 grayscale-[30%]' : ''}`}>
          <div className="bg-orange-600 text-white p-3 rounded-xl font-black text-center shadow-sm sticky top-4 z-10">
            주장 B 의견 공간
          </div>
          
          {userStance === 'B' ? (
            <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm flex flex-col gap-3">
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="주장 B를 지지하는 의견을 작성해주세요. (Enter를 눌러 등록)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white resize-none h-24"
              />
              <button disabled={isSubmitting} onClick={handleAddComment} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors self-end disabled:opacity-50">
                {isSubmitting ? '등록 중...' : '의견 등록'}
              </button>
            </div>
          ) : (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <textarea 
                disabled
                placeholder="다른 진영에 투표하여 잠금 처리되었습니다."
                className="w-full bg-slate-200 border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 cursor-not-allowed text-slate-500 font-bold"
              />
              <button disabled className="bg-slate-400 text-white font-bold py-2 px-4 rounded-lg text-sm self-end cursor-not-allowed">
                잠금됨
              </button>
            </div>
          )}
          
          <div className="flex flex-col">
            {bestCommentsB.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-black text-orange-700 mb-3 flex items-center gap-1.5"><span className="text-lg">🔥</span> 베스트 의견</h4>
                <div className="flex flex-col gap-1">
                  {bestCommentsB.map(comment => (
                    <DiscussionCommentItem key={`best-${comment.id}`} comment={comment} isBest={true} topicAuthorId={topicAuthorId} />
                  ))}
                </div>
              </div>
            )}
            
            {commentsB.length > 0 && (
              <>
                {bestCommentsB.length > 0 && <h4 className="text-xs font-black text-slate-400 mb-3 border-t border-slate-100 pt-4">최신 의견</h4>}
                {commentsB.map(comment => {
                  const isBest = bestCommentsB.some(c => c.id === comment.id);
                  return <DiscussionCommentItem key={comment.id} comment={comment} isBest={isBest} topicAuthorId={topicAuthorId} />;
                })}
              </>
            )}
            
            {commentsB.length === 0 && (
              <div className="text-center text-slate-400 py-10 font-medium">아직 등록된 의견이 없습니다.</div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

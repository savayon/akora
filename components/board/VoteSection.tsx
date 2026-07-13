import React from 'react';
import { UserBadge } from '@/components/UserBadge';
import type { DiscussionTopic } from '@/types';

type VoteSectionProps = {
  topic: DiscussionTopic;
  userStance: 'A' | 'B' | null;
  handleVote: (stance: 'A' | 'B') => void;
  handleDeleteTopic: () => void;
  openReportModal: (type: 'post' | 'comment', id: string) => void;
  currentUser: { id: string; name: string; role: string; isOnboarded: boolean };
  onSoftDeleteByAdmin: (id: string, reason: string) => void;
};

export function VoteSection({
  topic,
  userStance,
  handleVote,
  handleDeleteTopic,
  openReportModal,
  currentUser,
  onSoftDeleteByAdmin
}: VoteSectionProps) {
  return (
    <div id="voting-section" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8 text-center bg-slate-50 border-b border-slate-100 relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black text-slate-500 bg-slate-200 px-2.5 py-1 rounded">주제</span>
          <div className="flex gap-3">
            {currentUser.id === topic.authorId && !topic.deletedAt && (
              <button onClick={handleDeleteTopic} className="text-[10px] text-slate-400 hover:text-red-600 transition-colors font-bold">
                🗑️ 삭제
              </button>
            )}
            {currentUser.role === 'admin' && !topic.deletedAt && (
              <button 
                onClick={() => {
                  const reason = prompt('관리자 권한으로 이 논제를 숨김/삭제 처리합니다.\n삭제 이유를 입력해주세요:');
                  if (reason) {
                    onSoftDeleteByAdmin(topic.id as string, reason);
                  }
                }} 
                className="text-[10px] text-red-500 hover:text-red-700 transition-colors font-bold"
              >
                🛡️ 숨기기 (관리자)
              </button>
            )}
            <button onClick={() => openReportModal('post', topic.id as string)} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-bold">
              🚨 신고
            </button>
          </div>
        </div>
        
        <h1 className={`text-2xl md:text-3xl font-black leading-snug mb-4 ${topic.deletedAt ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
          {topic.title}
        </h1>
        
        {topic.deletedAt && (
          <div className="mb-4 inline-block bg-red-50 border border-red-200 text-red-600 text-sm font-bold px-4 py-2 rounded-lg">
            삭제된 논제입니다. 사유: {topic.deletedReason || '없음'}
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 text-sm">
          <UserBadge name={topic.author} uuid={topic.authorId} size="w-6 h-6" iconSize="w-4 h-4" />
          <span className="text-slate-400">|</span>
          <span className="font-medium text-slate-500">{topic.createdAt}</span>
        </div>
      </div>
      
      <div className={`p-6 md:p-8 ${topic.deletedAt ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
        <div className="relative">
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800 rounded-full items-center justify-center text-white font-black text-sm shadow-md border-4 border-white">
            VS
          </div>
          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white">
            VS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* 주장 A 버튼 */}
            <div
              className={`p-6 md:p-8 rounded-xl border-2 text-left transition-all flex flex-col min-h-[240px] ${
                userStance === 'A' 
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-100 relative' 
                  : 'border-blue-100 bg-blue-50/40 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="w-full flex justify-between items-start mb-4">
                {userStance === 'A' ? (
                  <span className="text-blue-600 font-black text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    선택됨
                  </span>
                ) : (
                  <span></span>
                )}
                {userStance && <span className="font-bold text-blue-600/70 text-sm">투표수: {topic.votesA}명</span>}
              </div>
              <div className="flex-1 flex flex-col justify-center w-full">
                <p className={`font-bold text-lg md:text-xl leading-relaxed ${userStance === 'A' ? 'text-blue-950' : 'text-slate-800'}`}>
                  {topic.stanceA}
                </p>
              </div>
              <button 
                onClick={() => handleVote('A')}
                className={`mt-6 w-full py-3 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                  userStance === 'A' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {userStance === 'A' ? '✓ 투표 완료' : '투표하기'}
              </button>
            </div>

            {/* 주장 B 버튼 */}
            <div
              className={`p-6 md:p-8 rounded-xl border-2 text-left transition-all flex flex-col min-h-[240px] ${
                userStance === 'B' 
                  ? 'border-orange-500 bg-orange-50 shadow-md ring-4 ring-orange-100 relative' 
                  : 'border-orange-100 bg-orange-50/40 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <div className="w-full flex justify-between items-start mb-4">
                {userStance === 'B' ? (
                  <span className="text-orange-600 font-black text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    선택됨
                  </span>
                ) : (
                  <span></span>
                )}
                {userStance && <span className="font-bold text-orange-600/70 text-sm">투표수: {topic.votesB}명</span>}
              </div>
              <div className="flex-1 flex flex-col justify-center w-full">
                <p className={`font-bold text-lg md:text-xl leading-relaxed ${userStance === 'B' ? 'text-orange-950' : 'text-slate-800'}`}>
                  {topic.stanceB}
                </p>
              </div>
              <button 
                onClick={() => handleVote('B')}
                className={`mt-6 w-full py-3 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                  userStance === 'B' 
                    ? 'bg-orange-600 text-white shadow-sm' 
                    : 'bg-white border border-slate-300 text-slate-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                {userStance === 'B' ? '✓ 투표 완료' : '투표하기'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
          💡 두 의견 중 하나를 선택해 투표하면 상세 의견을 확인하고 댓글을 작성할 수 있습니다.<br/>
          선택한 진영은 언제든 변경할 수 있으나, 기존에 작성했던 댓글은 삭제됩니다.
        </div>
      </div>
    </div>
  );
}

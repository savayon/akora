'use client';

import React from 'react';
import { Judgment, Debate } from '@/types';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/formatTime';

interface VerdictResultBoardProps {
  debate: Debate;
  judgments: Judgment[];
}

export default function VerdictResultBoard({ debate, judgments }: VerdictResultBoardProps) {
  if (!judgments || judgments.length === 0) return null;

  // 단순 득표수 계산 (UI 용)
  let proposerVotes = 0;
  let responderVotes = 0;

  judgments.forEach(j => {
    if (j.votedForId === debate.proposerId) proposerVotes++;
    else if (j.votedForId === debate.responderId) responderVotes++;
  });

  const totalVotes = proposerVotes + responderVotes;
  const isProposerWinner = proposerVotes > responderVotes;
  const isTie = proposerVotes === responderVotes;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm my-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-2">최종 판정 결과</h2>
        <p className="text-slate-500">배심원들의 다수결에 의해 토론의 승패가 결정되었습니다.</p>
        
        <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4">
          <div className={`p-6 rounded-2xl border-2 flex-1 w-full max-w-sm ${isProposerWinner ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
            <div className="text-sm font-bold text-blue-600 mb-1">찬성 측</div>
            <div className="text-xl font-black text-slate-900 mb-2">{debate.proposerName}</div>
            <div className="text-3xl font-black text-blue-500">{proposerVotes}표</div>
            {isProposerWinner && <div className="mt-3 inline-block px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">🏆 WINNER</div>}
          </div>
          
          <div className="text-xl font-black text-slate-300">VS</div>
          
          <div className={`p-6 rounded-2xl border-2 flex-1 w-full max-w-sm ${!isProposerWinner && !isTie ? 'border-red-500 bg-red-50 shadow-md' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
            <div className="text-sm font-bold text-red-600 mb-1">반대 측</div>
            <div className="text-xl font-black text-slate-900 mb-2">{debate.responderName}</div>
            <div className="text-3xl font-black text-red-500">{responderVotes}표</div>
            {!isProposerWinner && !isTie && <div className="mt-3 inline-block px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">🏆 WINNER</div>}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span>📝</span> 배심원 코멘트 ({totalVotes})
        </h3>
        
        <div className="space-y-4">
          {judgments.map((j) => {
            const isVotedProposer = j.votedForId === debate.proposerId;
            
            return (
              <div key={j.id} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center text-slate-400 text-xs font-bold">
                      {/* 실제 유저 정보를 조인해서 가져온다면 아바타/닉네임을 렌더링. MVP에서는 DB 조인 전이므로 단순화된 닉네임 자리 표시자. */}
                      {j.jurorType === 'human' ? '👤' : '🤖'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        배심원
                        {j.jurorType === 'expert' && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded">EXPERT</span>}
                        {j.jurorType === 'ai' && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded">AI</span>}
                      </div>
                      <div className="text-xs text-slate-400">{formatRelativeTime(j.createdAt)}</div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    isVotedProposer ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {isVotedProposer ? '찬성 측 승리' : '반대 측 승리'}
                  </div>
                </div>
                <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-slate-200">
                  {j.reason}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

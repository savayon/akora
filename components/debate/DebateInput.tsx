import React from 'react';
import { Turn } from '@/types';

type ReplyTarget = {
  quotedTurnId: number | string;
  quotedTurnNum: number;
  quotedAuthorName: string;
  quotedExcerpt: string;
} | null;

type DebateInputProps = {
  role: 'proposer' | 'responder' | 'viewer';
  isDebateEnded: boolean;
  currentTurnOwner: 'proposer' | 'responder';
  replyTarget: ReplyTarget;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSubmit: () => void;
  handleEndDebate: () => void;
  setReplyTarget: (target: ReplyTarget) => void;
};

export const DebateInput: React.FC<DebateInputProps> = ({
  role,
  isDebateEnded,
  currentTurnOwner,
  replyTarget,
  inputValue,
  setInputValue,
  handleKeyDown,
  handleSubmit,
  handleEndDebate,
  setReplyTarget
}) => {
  if (role === 'viewer' || isDebateEnded) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 pointer-events-none mt-auto">
      <div className="bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 px-4 sm:px-6 lg:px-8 pointer-events-auto">
        <div className="max-w-4xl mx-auto">
          
          {role === currentTurnOwner ? (
            <div className="relative bg-white shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-2xl p-3 border border-yellow-300 transition-all focus-within:border-yellow-500 focus-within:ring-4 focus-within:ring-yellow-100 flex flex-col gap-2">
              
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-black text-yellow-600 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  나의 발언 턴입니다
                </span>
                <button onClick={handleEndDebate} className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors">
                  🏳️ 토론 종료 제안
                </button>
              </div>

              {replyTarget && (
                <div className="mx-2 mt-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl flex items-start justify-between gap-3 animate-in slide-in-from-bottom-2 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-400"></div>
                  <div className="flex-1">
                    <span className="text-[11px] font-black text-purple-600 flex items-center gap-1 mb-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      Round {replyTarget.quotedTurnNum} {replyTarget.quotedAuthorName} 발언 인용 중
                    </span>
                    <p className="text-sm font-medium text-slate-700 line-clamp-1 leading-snug">"{replyTarget.quotedExcerpt}"</p>
                  </div>
                  <button 
                    onClick={() => setReplyTarget(null)}
                    className="text-slate-400 hover:text-red-500 bg-white shadow-sm border border-slate-200 rounded-full p-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="감정적인 비난은 배제하고, 논리적인 근거로 상대방을 설득해 보세요. (Enter로 전송, Shift+Enter로 줄바꿈)"
                  className="w-full bg-slate-50 resize-none outline-none rounded-xl text-slate-800 p-3 text-sm md:text-base min-h-[80px]"
                />
                <button 
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className="shrink-0 bg-slate-900 text-white font-bold h-12 px-6 rounded-xl text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  발언하기
                </button>
              </div>
            </div>
          ) : (
            <div className="relative opacity-70 pointer-events-none bg-slate-100 rounded-2xl p-3 border border-slate-200">
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  🔒 상대방의 발언을 기다리는 중입니다
                </div>
              </div>
              <div className="flex items-end gap-2">
                <textarea 
                  disabled
                  placeholder="내 턴이 아닙니다."
                  className="w-full bg-transparent resize-none outline-none text-slate-400 p-3 text-sm md:text-base min-h-[80px]"
                />
                <button disabled className="shrink-0 bg-slate-300 text-white font-bold h-12 px-6 rounded-xl text-sm">
                  발언하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

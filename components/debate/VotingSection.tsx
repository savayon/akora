import React, { useState, useEffect } from 'react';
import { UserAvatar } from '@/components/UserBadge';

type VotingSectionProps = {
  role: 'proposer' | 'responder' | 'viewer';
  hasFinalVoted: boolean;
  onVote: (stance: 'proposer' | 'responder') => void;
  debateMeta: {
    proposerName: string;
    responderName: string;
    proposerId?: string;
    responderId?: string;
    proposerAvatarUrl?: string | null;
    responderAvatarUrl?: string | null;
  };
  voteStats: { proposer: number; responder: number; proposerPersuaded: number; responderPersuaded: number };
};

export const VotingSection: React.FC<VotingSectionProps> = ({ role, hasFinalVoted, onVote, debateMeta, voteStats }) => {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 - 3600); // e.g. 23 hours left

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const totalVotes = voteStats.proposer + voteStats.responder;
  const proposerPercent = totalVotes > 0 ? Math.round((voteStats.proposer / totalVotes) * 100) : null;
  const responderPercent = totalVotes > 0 ? 100 - proposerPercent! : null;

  return (
    <section className="bg-white border-2 border-yellow-400 rounded-2xl p-4 md:p-6 shadow-sm mb-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-slate-900">최종 투표하기</h2>
        <p className="text-slate-600 font-bold mt-1 text-sm">더 논리적인 측에 투표해주세요!</p>
      </div>

      {role === 'viewer' && !hasFinalVoted ? (
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          <button onClick={() => onVote('responder')} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group">
            <UserAvatar name={debateMeta.responderName} uuid={debateMeta.responderId} avatarUrl={debateMeta.responderAvatarUrl} size="w-10 h-10" iconSize="w-6 h-6" containerClass="grayscale group-hover:grayscale-0 transition-all border-2 border-blue-400" />
            <span className="font-black text-slate-700 group-hover:text-blue-600 text-base">{debateMeta.responderName}</span>
          </button>
          <button onClick={() => onVote('proposer')} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-colors group">
            <UserAvatar name={debateMeta.proposerName} uuid={debateMeta.proposerId} avatarUrl={debateMeta.proposerAvatarUrl} size="w-10 h-10" iconSize="w-6 h-6" containerClass="grayscale group-hover:grayscale-0 transition-all border-2 border-orange-400" />
            <span className="font-black text-slate-700 group-hover:text-orange-600 text-base">{debateMeta.proposerName}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col p-4 rounded-xl border-2 border-blue-200 bg-blue-50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserAvatar name={debateMeta.responderName} uuid={debateMeta.responderId} avatarUrl={debateMeta.responderAvatarUrl} size="w-8 h-8" iconSize="w-5 h-5" containerClass="border border-blue-400 shadow-sm" />
                <h3 className="font-black text-slate-800 text-sm">{debateMeta.responderName}</h3>
              </div>
              <span className="font-black text-blue-600 text-xl">{responderPercent === null ? '-' : `${responderPercent}%`}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
               <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${responderPercent ?? 0}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              {voteStats.responderPersuaded >= Math.ceil(totalVotes * 0.3) && totalVotes > 0 && (
                <span className="text-[10px] font-black text-blue-600 bg-blue-200 px-1.5 py-0.5 rounded">설득의 대가 🏅</span>
              )}
              <div className="text-right text-xs font-bold text-slate-500 ml-auto">
                <span className="mr-2 text-blue-600">설득: {voteStats.responderPersuaded}명</span>
                {voteStats.responder}표
              </div>
            </div>
          </div>
          <div className="flex flex-col p-4 rounded-xl border-2 border-orange-200 bg-orange-50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserAvatar name={debateMeta.proposerName} uuid={debateMeta.proposerId} avatarUrl={debateMeta.proposerAvatarUrl} size="w-8 h-8" iconSize="w-5 h-5" containerClass="border border-orange-400 shadow-sm" />
                <h3 className="font-black text-slate-800 text-sm">{debateMeta.proposerName}</h3>
              </div>
              <span className="font-black text-orange-600 text-xl">{proposerPercent === null ? '-' : `${proposerPercent}%`}</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2 mt-1">
              <div className="bg-orange-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${proposerPercent ?? 0}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              {voteStats.proposerPersuaded >= Math.ceil(totalVotes * 0.3) && totalVotes > 0 && (
                <span className="text-[10px] font-black text-orange-600 bg-orange-200 px-1.5 py-0.5 rounded">설득의 대가 🏅</span>
              )}
              <div className="text-right text-xs font-bold text-slate-500 ml-auto">
                <span className="mr-2 text-orange-600">설득: {voteStats.proposerPersuaded}명</span>
                {voteStats.proposer}표
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 투표 기한 타이머 */}
      <div className="mt-8 flex justify-center">
        <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600">투표 종료까지</span>
          <span className="text-xl font-black text-red-500 font-mono tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </div>
    </section>
  );
};

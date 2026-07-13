import React, { useState, useEffect } from 'react';
import { UserAvatar } from '@/components/UserBadge';

type VotingSectionProps = {
  role: 'proposer' | 'responder' | 'viewer';
  hasVoted: boolean;
  onVote: (stance: 'proposer' | 'responder') => void;
  debateMeta: {
    proposerName: string;
    responderName: string;
    proposerId?: string;
    responderId?: string;
    proposerAvatarUrl?: string | null;
    responderAvatarUrl?: string | null;
  };
  voteStats: { proposer: number; responder: number };
};

export const VotingSection: React.FC<VotingSectionProps> = ({ role, hasVoted, onVote, debateMeta, voteStats }) => {
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
  const proposerPercent = totalVotes > 0 ? Math.round((voteStats.proposer / totalVotes) * 100) : 50;
  const responderPercent = totalVotes > 0 ? 100 - proposerPercent : 50;

  return (
    <section className="bg-white border-2 border-yellow-400 rounded-2xl p-6 md:p-8 shadow-md">
      <div className="text-center mb-8">
        <span className="inline-block bg-yellow-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full mb-3 shadow-sm">STEP 3</span>
        <h2 className="text-2xl font-black text-slate-900">최종 투표하기</h2>
        <p className="text-slate-600 font-bold mt-2">두 사람의 주장을 모두 확인하셨나요? 더 논리적인 측에 투표해주세요!</p>
      </div>

      {role === 'viewer' && !hasVoted ? (
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          <button onClick={() => onVote('responder')} className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group">
            <UserAvatar name={debateMeta.responderName} uuid={debateMeta.responderId} avatarUrl={debateMeta.responderAvatarUrl} size="w-16 h-16" iconSize="w-12 h-12" containerClass="mb-3 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 border-2 border-blue-400" />
            <span className="font-black text-slate-700 group-hover:text-blue-600 text-lg md:text-xl">{debateMeta.responderName}</span>
          </button>
          <button onClick={() => onVote('proposer')} className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-colors group">
            <UserAvatar name={debateMeta.proposerName} uuid={debateMeta.proposerId} avatarUrl={debateMeta.proposerAvatarUrl} size="w-16 h-16" iconSize="w-12 h-12" containerClass="mb-3 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 border-2 border-orange-400" />
            <span className="font-black text-slate-700 group-hover:text-orange-600 text-lg md:text-xl">{debateMeta.proposerName}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col p-6 rounded-xl border-2 border-blue-200 bg-blue-50 relative overflow-hidden">
            <div className="absolute top-3 left-4 text-xs font-black text-blue-500 bg-blue-100 px-2 py-0.5 rounded">방패측</div>
            <div className="flex items-center justify-between mt-4 mb-3">
              <UserAvatar name={debateMeta.responderName} uuid={debateMeta.responderId} avatarUrl={debateMeta.responderAvatarUrl} size="w-12 h-12" iconSize="w-8 h-8" containerClass="border-2 border-blue-400 shadow-sm" />
              <span className="font-black text-blue-600 text-3xl md:text-4xl">{responderPercent}%</span>
            </div>
            <h3 className="font-black text-slate-800 text-lg mb-2 text-right">{debateMeta.responderName}</h3>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${responderPercent}%` }}></div>
            </div>
            <p className="text-right text-xs font-bold text-slate-500 mt-2">{voteStats.responder}표</p>
          </div>
          <div className="flex flex-col p-6 rounded-xl border-2 border-orange-200 bg-orange-50 relative overflow-hidden">
            <div className="absolute top-3 left-4 text-xs font-black text-orange-500 bg-orange-100 px-2 py-0.5 rounded">창측</div>
            <div className="flex items-center justify-between mt-4 mb-3">
              <UserAvatar name={debateMeta.proposerName} uuid={debateMeta.proposerId} avatarUrl={debateMeta.proposerAvatarUrl} size="w-12 h-12" iconSize="w-8 h-8" containerClass="border-2 border-orange-400 shadow-sm" />
              <span className="font-black text-orange-600 text-3xl md:text-4xl">{proposerPercent}%</span>
            </div>
            <h3 className="font-black text-slate-800 text-lg mb-2 text-right">{debateMeta.proposerName}</h3>
            <div className="w-full bg-orange-200 rounded-full h-3">
              <div className="bg-orange-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${proposerPercent}%` }}></div>
            </div>
            <p className="text-right text-xs font-bold text-slate-500 mt-2">{voteStats.proposer}표</p>
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

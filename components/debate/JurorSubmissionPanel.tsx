'use client';

import React, { useState } from 'react';
import { Debate } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { JudgmentService } from '@/services/judgmentService';

interface JurorSubmissionPanelProps {
  debate: Debate;
  onSubmitted: () => void;
}

export default function JurorSubmissionPanel({ debate, onSubmitted }: JurorSubmissionPanelProps) {
  const { currentUser } = useAppStore();
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 본인이 참가자라면 판정에 참여할 수 없음
  if (currentUser?.id === debate.proposerId || currentUser?.id === debate.responderId) {
    return null;
  }

  // 비로그인 사용자 방어
  if (!currentUser) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-2">배심원으로 참여하세요</h3>
        <p className="text-sm text-slate-500">
          토론의 승패를 결정지을 배심원이 되려면 로그인이 필요합니다.
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selectedWinnerId) {
      alert('승자를 선택해주세요.');
      return;
    }
    if (reason.trim().length < 10) {
      alert('판정 이유를 10자 이상 작성해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await JudgmentService.submitAndCheckCompletion(
        String(debate.id),
        currentUser.id,
        'human',
        selectedWinnerId,
        reason.trim()
      );

      if (res.success) {
        alert('판정이 제출되었습니다. 귀하의 의견이 결과에 반영됩니다.');
        onSubmitted();
      }
    } catch (error: any) {
      alert(error.message || '판정 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-sm mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>⚖️</span> 판정 내리기
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          이 토론은 배심원(관전자)들의 판정으로 최종 승패가 결정됩니다. 
          어느 측의 논리가 더 타당했는지 선택하고 그 이유를 남겨주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setSelectedWinnerId(debate.proposerId!)}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            selectedWinnerId === debate.proposerId 
              ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200 ring-offset-2' 
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold text-blue-600 mb-1">찬성 측 승리</div>
          <div className="font-black text-slate-800 text-lg">{debate.proposerName}</div>
          <div className="text-sm text-slate-500 line-clamp-2 mt-2">{debate.proposerClaim}</div>
        </button>

        <button
          onClick={() => setSelectedWinnerId(debate.responderId!)}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            selectedWinnerId === debate.responderId 
              ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200 ring-offset-2' 
              : 'border-slate-200 hover:border-red-300 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold text-red-600 mb-1">반대 측 승리</div>
          <div className="font-black text-slate-800 text-lg">{debate.responderName}</div>
          <div className="text-sm text-slate-500 line-clamp-2 mt-2">{debate.responderClaim}</div>
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          판정 이유를 남겨주세요 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="어떤 점이 설득력 있었나요? (10자 이상)"
          className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedWinnerId || reason.trim().length < 10}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isSubmitting ? '제출 중...' : '판정 확정하기'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Debate } from '@/types';
import { debateRepository } from '@/repositories';
import { NotificationService } from '@/services';

type Props = {
  debate: Debate;
  role: 'proposer' | 'responder' | 'viewer';
  currentUserId: string;
  onChanged: () => Promise<void>;
};

export function TopicChangeControls({ debate, role, currentUserId, onChanged }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isParticipant = role !== 'viewer';
  const isRequester = debate.topicChangeRequesterId === currentUserId;
  const usedCount = role === 'proposer'
    ? debate.proposerTopicEditCount || 0
    : debate.responderTopicEditCount || 0;

  const requestChange = async () => {
    if (!newTopic.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { recipientId } = await debateRepository.requestTopicChange(String(debate.id), newTopic);
      if (recipientId) {
        await NotificationService.createNotification([recipientId], {
          type: 'topic_change_requested',
          icon: '✏️',
          message: '토론 제목 변경 요청이 도착했습니다.',
          subtext: '변경 요청: ' + newTopic.trim(),
          link: '/debate/live/' + debate.id,
        });
      }
      setIsEditing(false);
      setNewTopic('');
      await onChanged();
    } catch (error: any) {
      alert(error.message || '제목 변경을 요청하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolve = async (approve: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (approve) await debateRepository.approveTopicChange(String(debate.id));
      else await debateRepository.rejectTopicChange(String(debate.id));
      await onChanged();
    } catch (error: any) {
      alert(error.message || '제목 변경 요청을 처리하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isParticipant || debate.status !== 'in_progress') return null;

  return (
    <>
      <div className="flex items-center gap-2">
        {debate.pendingTopic ? (
          <span className="text-xs font-bold text-slate-400">
            {isRequester ? '제목 변경 응답 대기 중' : '제목 변경 요청 도착'}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
            disabled={usedCount >= 2}
            className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            제목 변경 요청 ({2 - usedCount}회)
          </button>
        )}
      </div>

      {isEditing && (
        <div className="absolute top-full right-0 mt-2 z-30 w-72 bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4">
          <p className="text-sm font-black text-slate-900 mb-2">토론 제목 변경 요청</p>
          <input
            value={newTopic}
            onChange={(event) => setNewTopic(event.target.value)}
            maxLength={20}
            placeholder="새 제목을 입력해 주세요"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-500 px-2 py-1.5">취소</button>
            <button type="button" onClick={requestChange} disabled={isSubmitting || !newTopic.trim()} className="text-xs font-bold text-white bg-purple-600 px-3 py-1.5 rounded-lg disabled:opacity-40">요청</button>
          </div>
        </div>
      )}

      {debate.pendingTopic && !isRequester && (
        <div className="fixed z-50 top-24 left-1/2 -translate-x-1/2 w-[min(340px,calc(100vw-32px))] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-sm font-black text-slate-900">토론 제목 변경 요청</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] font-bold text-slate-400 mb-1">기존 제목</p>
              <p className="font-bold text-slate-700">{debate.topic}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
              <p className="text-[11px] font-bold text-purple-500 mb-1">변경 요청</p>
              <p className="font-bold text-purple-800">{debate.pendingTopic}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button type="button" onClick={() => resolve(false)} disabled={isSubmitting} className="py-2.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold disabled:opacity-40">거절</button>
            <button type="button" onClick={() => resolve(true)} disabled={isSubmitting} className="py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold disabled:opacity-40">수락</button>
          </div>
        </div>
      )}
    </>
  );
}

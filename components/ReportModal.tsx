"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { reportRepository } from '@/repositories';

const REPORT_REASONS = [
  '욕설/비방',
  '도배',
  '혐오 표현',
  '음란성',
  '허위 정보',
  '기타',
];

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, reportTarget, closeReportModal } = useAppStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReportModalOpen || !reportTarget) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }
    if (selectedReason === '기타' && !detail.trim()) {
      alert('기타 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportRepository.createReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id.toString(),
        reason: selectedReason,
        detail: selectedReason === '기타' ? detail : undefined,
      });
      alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      handleClose();
    } catch (e) {
      alert('신고 접수 중 오류가 발생했습니다. 로그인 상태를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetail('');
    closeReportModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            🚨 <span>{reportTarget.type === 'post' ? '게시글' : '댓글'} 신고하기</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            허위 신고 시 이용이 제한될 수 있습니다.
          </p>
        </div>

        {/* 사유 선택 */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-bold text-slate-700 mb-3">신고 사유를 선택해주세요</p>
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedReason === reason
                  ? 'border-red-400 bg-red-50 ring-1 ring-red-400'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
                className="accent-red-500"
              />
              <span className="text-sm font-bold text-slate-700">{reason}</span>
            </label>
          ))}

          {/* 기타 사유 입력 */}
          {selectedReason === '기타' && (
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="상세 사유를 입력해주세요..."
              className="w-full mt-2 p-3 border border-slate-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '접수 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

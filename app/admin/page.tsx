"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { reportRepository } from '@/repositories';
import type { Report } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser.role !== 'admin') {
      router.replace('/');
      return;
    }
    
    fetchReports();
  }, [currentUser, router]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportRepository.getReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHideTarget = async (type: 'post' | 'comment', id: string | number, reportId: string | number) => {
    if (!window.confirm(`이 ${type === 'post' ? '게시글' : '댓글'}을 목록에서 숨기시겠습니까?`)) return;
    
    try {
      await reportRepository.hideTarget(type, id.toString());
      await reportRepository.updateStatus(reportId.toString(), 'resolved');
      alert('콘텐츠가 숨김 처리되었으며 신고가 해결(resolved) 처리되었습니다.');
      fetchReports();
    } catch (e) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleDismissReport = async (reportId: string | number) => {
    if (!window.confirm('이 신고를 기각하시겠습니까?')) return;
    
    try {
      await reportRepository.updateStatus(reportId.toString(), 'dismissed');
      alert('신고가 기각(dismissed) 처리되었습니다.');
      fetchReports();
    } catch (e) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-black text-red-600 mb-4">403</h1>
          <p className="text-slate-600 font-medium">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const dismissedCount = reports.filter(r => r.status === 'dismissed').length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900">관리자 대시보드</h1>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl font-black">🚨</div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">접수 대기</p>
              <p className="text-3xl font-black text-slate-800">{pendingCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl font-black">✅</div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">처리 완료 (숨김)</p>
              <p className="text-3xl font-black text-slate-800">{resolvedCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-2xl font-black">🗑️</div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">기각 처리됨</p>
              <p className="text-3xl font-black text-slate-800">{dismissedCount}</p>
            </div>
          </div>
        </div>

        {/* 신고 목록 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">최근 신고 내역</h2>
          </div>
          
          <div className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-slate-500 font-medium">데이터를 불러오는 중입니다...</div>
            ) : reports.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">신고된 콘텐츠가 없습니다.</h3>
                <p className="text-sm text-slate-500">현재 플랫폼이 아주 평화롭습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <div key={report.id} className={`p-6 flex flex-col md:flex-row gap-6 transition-colors ${report.status === 'pending' ? 'bg-white' : 'bg-slate-50/50'}`}>
                    
                    {/* 정보 영역 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {report.targetType === 'post' ? (
                          <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded border border-blue-200">
                            게시글
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded border border-purple-200">
                            댓글
                          </span>
                        )}
                        <span className={`text-xs font-black px-2 py-1 rounded ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {report.status.toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-slate-400 ml-auto">
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                          <span className="text-red-600">[{report.reason}]</span>
                        </h3>
                        {report.detail && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                            &quot;{report.detail}&quot;
                          </p>
                        )}
                        <p className="text-xs text-slate-500 font-medium mt-2">
                          신고자: <span className="font-bold text-slate-700">{report.reporterId}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* 액션 영역 */}
                    <div className="flex flex-row md:flex-col gap-2 md:w-32">
                      {report.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleHideTarget(report.targetType, report.targetId, report.id)}
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                          >
                            콘텐츠 숨김
                          </button>
                          <button 
                            onClick={() => handleDismissReport(report.id)}
                            className="flex-1 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                          >
                            신고 기각
                          </button>
                        </>
                      )}
                      {report.status !== 'pending' && (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-slate-300 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold p-2">
                          처리 완료됨
                        </div>
                      )}
                    </div>
                    
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

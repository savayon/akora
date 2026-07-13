"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { discussionRepository } from '@/repositories';

export default function CreateDiscussionPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [stanceA, setStanceA] = useState('');
  const [stanceB, setStanceB] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !stanceA.trim() || !stanceB.trim()) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    
    if (topic.trim().length < 5 || stanceA.trim().length < 5 || stanceB.trim().length < 5) {
      alert('주제와 각 진영의 주장은 최소 5글자 이상 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await discussionRepository.createTopic({
        title: topic,
        stanceA,
        stanceB,
      });
      alert('새로운 주제가 성공적으로 등록되었습니다!');
      router.push('/board/debate');
    } catch (error: any) {
      alert(error.message || '주제 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">새로운 주제 만들기</h1>
            <p className="text-sm text-slate-500 font-medium">다양한 의견을 나누고 싶은 주제를 만들어보세요. 치열한 논의를 거쳐 정식 토론으로 발전할 수 있습니다.</p>
          </div>
          <span className="text-4xl">💡</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* 논제 제목 */}
          <div>
            <label htmlFor="topic" className="block text-sm font-bold text-slate-700 mb-2">
              주제 (논제)
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: AI 규제를 지금 즉시 강화해야 하는가?"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-slate-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* 주장 A */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
              <label htmlFor="stanceA" className="block text-sm font-black text-blue-600 mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">A</span>
                주장 A
              </label>
              <textarea
                id="stanceA"
                value={stanceA}
                onChange={(e) => setStanceA(e.target.value)}
                placeholder="예: AI 발전 속도가 인류 통제를 벗어나기 전에 글로벌 규제가 필요하다."
                className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all resize-none h-28 text-sm text-slate-800"
              />
            </div>

            {/* 주장 B */}
            <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100">
              <label htmlFor="stanceB" className="block text-sm font-black text-orange-600 mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">B</span>
                주장 B
              </label>
              <textarea
                id="stanceB"
                value={stanceB}
                onChange={(e) => setStanceB(e.target.value)}
                placeholder="예: 과도한 사전 규제는 기술 혁신을 막고 국가 경쟁력만 저하시킬 뿐이다."
                className="w-full px-3 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all resize-none h-28 text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/" className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : '주제 등록하기'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { postRepository } from '@/repositories';
import { useAppStore } from '@/store/useAppStore';

function BoardWriteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAppStore();

  const [boardType, setBoardType] = useState<'free' | 'discuss'>('free');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const board = searchParams.get('board');
    if (board === 'discuss') {
      setBoardType('discuss');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    if (title.trim().length < 5 || content.trim().length < 5) {
      alert('제목과 내용은 각각 최소 5글자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await postRepository.createPost({
        board_type: boardType,
        title: title.trim(),
        content: content.trim()
      });
      
      alert('게시글이 등록되었습니다.');
      router.push(`/board/${boardType}/${newPost.id}`);
    } catch (error) {
      console.error(error);
      alert('게시글 등록 중 오류가 발생했습니다. 로그인을 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-6 md:p-8 space-y-6">
          
          {/* 게시판 선택 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">게시판 선택</label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors flex-1 ${boardType === 'free' ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="boardType" 
                  value="free" 
                  checked={boardType === 'free'} 
                  onChange={() => setBoardType('free')} 
                  className="accent-yellow-500"
                />
                <span className="font-bold text-slate-800">자유게시판</span>
              </label>
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors flex-1 ${boardType === 'discuss' ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="boardType" 
                  value="discuss" 
                  checked={boardType === 'discuss'} 
                  onChange={() => setBoardType('discuss')} 
                  className="accent-yellow-500"
                />
                <span className="font-bold text-slate-800">토의게시판</span>
              </label>
            </div>
          </div>

          {/* 제목 입력 */}
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">제목</label>
            <input 
              id="title"
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요" 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-medium text-slate-900"
              maxLength={100}
            />
          </div>

          {/* 내용 입력 */}
          <div>
            <label htmlFor="content" className="block text-sm font-bold text-slate-700 mb-2">내용</label>
            <textarea 
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요. 욕설, 비방, 도배 등은 운영정책에 따라 제재될 수 있습니다." 
              className="w-full h-80 px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-medium text-slate-900 resize-none"
            />
          </div>
          
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            취소
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-900 bg-yellow-400 hover:bg-yellow-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '등록 중...' : '게시글 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BoardWritePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">글쓰기</h1>
        <p className="text-slate-500">자유게시판 또는 토의게시판에 새로운 글을 작성합니다.</p>
      </div>
      <Suspense fallback={<div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium">로딩 중...</div>}>
        <BoardWriteForm />
      </Suspense>
    </div>
  );
}

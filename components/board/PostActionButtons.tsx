"use client";

import { useEffect, useState } from "react";

import { useAppStore } from '@/store/useAppStore';

export function PostActionButtons({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser, setIsLoginModalOpen } = useAppStore();

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    let isMounted = true;
    if (!currentUser.id) {
      setIsLiked(false);
      return;
    }

    const loadLikeStatus = async () => {
      try {
        const { postRepository } = await import('@/repositories');
        const liked = await postRepository.getPostLikeStatus(postId, currentUser.id);
        if (isMounted) setIsLiked(liked);
      } catch (error) {
        console.warn('Failed to load post like status:', error);
      }
    };

    loadLikeStatus();
    return () => { isMounted = false; };
  }, [postId, currentUser.id]);

  const handleToggleLike = async () => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isSubmitting) return;

    const previousLikes = likes;
    const previousIsLiked = isLiked;
    const nextIsLiked = !previousIsLiked;
    setLikes((value) => value + (nextIsLiked ? 1 : -1));
    setIsLiked(nextIsLiked);
    setIsSubmitting(true);

    try {
      const { postRepository } = await import('@/repositories');
      const persistedIsLiked = await postRepository.togglePostLike(postId, currentUser.id);
      setIsLiked(persistedIsLiked);
    } catch (e: any) {
      alert(e.message || '추천을 처리하지 못했습니다.');
      // rollback
      setLikes(previousLikes);
      setIsLiked(previousIsLiked);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('공유 링크가 클립보드에 복사되었습니다.');
    } catch (err) {
      alert('링크 복사에 실패했습니다.');
    }
  };

  return (
    <div className="p-6 border-t border-slate-50 bg-slate-50 flex flex-col sm:flex-row justify-center items-center gap-3">
      <button 
        onClick={handleToggleLike}
        disabled={isSubmitting}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border font-bold transition-colors shadow-sm cursor-pointer ${isLiked ? 'text-red-600 border-red-200 bg-red-50' : 'text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-red-600'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" /></svg>
        추천 {likes}
      </button>
      <button 
        onClick={handleShare} 
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 hover:text-blue-500 transition-colors shadow-sm cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        공유하기
      </button>
    </div>
  );
}

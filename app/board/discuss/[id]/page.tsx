"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommentSection } from '@/components/board/CommentSection';
import { PostActionButtons } from '@/components/board/PostActionButtons';
import { ContentRenderer } from '@/components/ContentRenderer';
import { useAppStore } from '@/store/useAppStore';
import { postRepository, commentRepository } from '@/repositories';
import type { Post, BoardComment } from '@/types';
import { formatRelativeTime } from '@/lib/formatTime';

export default function DiscussBoardDetailPage() {
  const { openReportModal, currentUser } = useAppStore();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [postData, commentsData] = await Promise.all([
          postRepository.getPost(postId),
          commentRepository.getBoardComments(postId),
        ]);
        setPost(postData);
        setComments(commentsData);
        
        // 조회수 어뷰징 방지 (24시간 쿨타임)
        const lastViewed = localStorage.getItem(`viewed_post_${postId}`);
        const now = Date.now();
        if (!lastViewed || now - parseInt(lastViewed) > 24 * 60 * 60 * 1000) {
          localStorage.setItem(`viewed_post_${postId}`, now.toString());
          postRepository.incrementViews(postId).catch(console.error);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [postId]);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 font-medium">게시글을 불러오는 중입니다...</div>;
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-700 mb-2">게시글을 찾을 수 없습니다.</h2>
        <Link href="/board/discuss" className="text-yellow-600 font-bold hover:underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-white">
      
      {/* 사용자 안내 문구 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800 leading-relaxed shadow-sm">
        <p className="font-bold mb-1">📢 토의게시판은 다양한 해결책과 관점을 함께 모으는 공간입니다.</p>
        <p>주제와 무관한 댓글, 인신공격, 단순 비난 등 생산적인 토의를 방해하는 행위는 운영정책에 따라 제재될 수 있습니다.</p>
      </div>

      {/* 게시글 상세 본문 영역 */}
      <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded">토의게시판</span>
            <span className="text-xs font-bold text-slate-400">{formatRelativeTime(post.created_at)}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug mb-6">{post.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div>
                <div className="font-bold text-slate-800">{post.author_name}</div>
                <div className="text-xs font-medium text-slate-500">작성자</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1">👁 {post.views_count}</span>
              <span className="flex items-center gap-1">❤️ {post.likes_count}</span>
              <button onClick={() => openReportModal('post', post.id)} className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors ml-2 font-bold text-xs cursor-pointer">
                🚨 신고
              </button>
              {currentUser?.id === post.author_id && (
                <button 
                  onClick={async () => {
                    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
                      try {
                        await postRepository.deletePost(post.id);
                        alert('삭제되었습니다.');
                        window.location.href = '/board/discuss';
                      } catch (e) {
                        alert('삭제 중 오류가 발생했습니다.');
                      }
                    }
                  }} 
                  className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors ml-2 font-bold text-xs cursor-pointer"
                >
                  🗑️ 삭제
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8 text-slate-800 leading-relaxed text-lg">
          <ContentRenderer content={post.content} />
        </div>
        <PostActionButtons postId={post.id} initialLikes={post.likes_count} />
      </article>

      <div className="flex justify-end mb-10">
        <Link href="/board/discuss" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-sm">
          목록으로
        </Link>
      </div>

      <CommentSection initialComments={comments} postAuthor={post.author_name} postAuthorId={post.author_id} isDiscussBoard={true} postId={post.id} />
    </div>
  );
}

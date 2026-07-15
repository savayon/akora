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
import { UserAvatar } from '@/components/UserBadge';

export default function FreeBoardDetailPage() {
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
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 font-medium">
        게시글을 불러오는 중입니다...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-700 mb-2">게시글을 찾을 수 없습니다.</h2>
        <p className="text-slate-500 mb-6">삭제되었거나 존재하지 않는 게시글입니다.</p>
        <Link href="/board/free" className="text-yellow-600 font-bold hover:underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-white">
      
      {/* 1. 토론 진행 중 배너 */}
      {post.has_active_debates && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full text-lg shadow-sm border border-purple-200">📖</span>
            <div>
              <h3 className="font-bold text-purple-900">이 게시글에서 파생된 토론이 진행 중입니다.</h3>
              <p className="text-sm text-purple-700">치열한 논리가 부딪히는 현장을 관전해 보세요.</p>
            </div>
          </div>
          <button 
            onClick={() => alert("관전하기 기능은 준비 중입니다.")}
            className="shrink-0 bg-white border border-purple-300 text-purple-700 hover:bg-purple-600 hover:text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
          >
            관전하기
          </button>
        </div>
      )}

      {/* 2. 게시글 상세 본문 영역 */}
      <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        {/* 게시글 헤더 */}
        <div className="p-6 md:p-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded">자유게시판</span>
            <span className="text-xs font-bold text-slate-400">{formatRelativeTime(post.created_at)}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug mb-6">
            {post.title}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={post.author_name} uuid={post.author_id} avatarUrl={post.author_avatar_url} size="w-10 h-10" iconSize="w-6 h-6" />
              <div>
                <div className={`font-bold text-slate-800 ${!post.author_id ? 'opacity-50 italic' : ''}`}>{!post.author_id ? '(알 수 없음)' : post.author_name}</div>
                <div className="text-xs font-medium text-slate-500">작성자</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {post.views_count}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {post.likes_count}
              </span>
              <button onClick={() => openReportModal('post', post.id)} className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors ml-2 font-bold text-xs cursor-pointer">
                🚨 신고
              </button>
              {currentUser?.id === post.author_id && !post.deletedAt && (
                <button 
                  onClick={async () => {
                    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
                      try {
                        await postRepository.deletePost(post.id);
                        alert('삭제되었습니다.');
                        window.location.href = '/board/free';
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
              {currentUser?.role === 'admin' && !post.deletedAt && (
                <button 
                  onClick={async () => {
                    const reason = prompt('관리자 권한으로 이 글을 숨김/삭제 처리합니다.\n삭제 이유를 입력해주세요:');
                    if (reason) {
                      try {
                        await postRepository.softDeletePost(post.id, reason);
                        alert('관리자 권한으로 삭제 처리되었습니다.');
                        window.location.reload();
                      } catch (e) {
                        alert('처리 중 오류가 발생했습니다.');
                      }
                    }
                  }} 
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors ml-2 font-bold text-xs cursor-pointer"
                >
                  🛡️ 숨기기 (관리자)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className={`p-6 md:p-8 text-slate-800 leading-relaxed text-lg ${post.deletedAt ? 'italic text-slate-500 bg-slate-50' : ''}`}>
          {post.deletedAt ? (
            <div className="flex flex-col gap-2">
              <span className="font-bold text-red-500">삭제된 글입니다.</span>
              <span className="text-sm">삭제된 이유: {post.deletedReason || '사유 없음'}</span>
            </div>
          ) : (
            <ContentRenderer content={post.content} />
          )}
        </div>

        {/* 본문 하단 액션 */}
        <PostActionButtons postId={post.id} initialLikes={post.likes_count} />
      </article>

      {/* 목록으로 버튼 */}
      <div className="flex justify-end mb-10">
        <Link href="/board/free" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-sm">
          목록으로
        </Link>
      </div>
      {/* 3. 댓글 영역 */}
      {!post.deletedAt && (
        <CommentSection 
          postId={post.id} 
          isDiscussBoard={false} 
          postAuthor={post.author_name} 
          postAuthorId={post.author_id} 
          postTitle={post.title}
          initialComments={comments}
        />
      )}
    </div>
  );
}

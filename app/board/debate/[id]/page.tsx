"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { discussionRepository } from '@/repositories';
import { DiscussionTopic, DiscussionComment } from '@/types';
import { UserBadge } from '@/components/UserBadge';
import { DiscussionCommentItem } from '@/components/DiscussionCommentItem';
import { VoteSection } from '@/components/board/VoteSection';
import { DebateCommentSection } from '@/components/board/DebateCommentSection';

export default function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser, openReportModal, setIsLoginModalOpen } = useAppStore();
  const [topic, setTopic] = useState<DiscussionTopic | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [userStance, setUserStance] = useState<'A' | 'B' | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTopicLiked, setIsTopicLiked] = useState(false);
  const [topicLikes, setTopicLikes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const foundTopic = await discussionRepository.getTopic(id);
      if (foundTopic) {
        setTopic(foundTopic);
        setTopicLikes(Math.floor((foundTopic.votesA + foundTopic.votesB) * 0.1));
        
        const existingVote = await discussionRepository.getUserVote(id);
        setUserStance(existingVote);
        
        const topicComments = await discussionRepository.getComments(id);
        setComments(topicComments);
      }
    };
    fetchData();
  }, [id]);

  if (!topic) {
    return <div className="p-10 text-center">논제를 불러오는 중입니다...</div>;
  }

  const visibleComments = comments;
  const commentsA = visibleComments.filter(c => c.stance === 'A');
  const commentsB = visibleComments.filter(c => c.stance === 'B');

  const handleVote = async (selectedStance: 'A' | 'B') => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }

    if (userStance === selectedStance) return;
    
    if (userStance !== null) {
      const confirmChange = window.confirm("진영을 변경하면 기존 진영에서 작성했던 모든 의견이 삭제됩니다. 계속하시겠습니까?");
      if (!confirmChange) return;
      
      try {
        await discussionRepository.deleteUserComments(id);
      } catch (err) {
        console.error("댓글 삭제 실패:", err);
      }
      
      // 낙관적 업데이트: 기존 댓글 즉시 UI에서 숨김
      setComments(prev => prev.filter(c => !(c.author === currentUser.name && c.stance === userStance)));
    } else {
      const confirmVote = window.confirm("투표하시겠습니까?");
      if (!confirmVote) return;
    }
    
    setUserStance(selectedStance);
    try {
      await discussionRepository.vote(id, selectedStance);
      // 투표 후 최신 주제 정보를 다시 불러옴 (선택 사항)
      const updatedTopic = await discussionRepository.getTopic(id);
      if (updatedTopic) setTopic(updatedTopic);
    } catch (e) {
      console.error(e);
      alert('투표 처리 중 오류가 발생했습니다.');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userStance || isSubmitting) return;
    
    if (newComment.trim().length < 5) {
      alert('댓글은 최소 5글자 이상 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const created = await discussionRepository.createComment(id, {
        content: newComment,
        stance: userStance
      });
      
      setComments([created, ...comments]);
      setNewComment('');
    } catch (error: any) {
      alert(error.message || '의견 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDeleteByAdmin = async (id: string, reason: string) => {
    try {
      await discussionRepository.softDeleteTopic(id, reason);
      alert('관리자 권한으로 삭제 처리되었습니다.');
      window.location.reload();
    } catch (e) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTopic = async () => {
    const confirmDelete = window.confirm('정말 이 논제를 삭제하시겠습니까? 관련 의견과 투표도 모두 삭제됩니다.');
    if (!confirmDelete) return;

    try {
      await discussionRepository.deleteTopic(id);
      alert('논제가 삭제되었습니다.');
      router.push('/board/debate');
    } catch (e: any) {
      alert(e.message || '논제 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleTopicLike = () => {
    if (isTopicLiked) {
      setTopicLikes(prev => prev - 1);
      setIsTopicLiked(false);
    } else {
      setTopicLikes(prev => prev + 1);
      setIsTopicLiked(true);
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

  // 베스트 댓글 추출 로직
  const getBestComments = (comments: DiscussionComment[]) => {
    const total = comments.length;
    let maxBestCount = 0;
    if (total >= 9) maxBestCount = 3;
    else if (total >= 5) maxBestCount = 2;
    else if (total >= 1) maxBestCount = 1;

    return [...comments]
      .filter(c => c.likes > 0)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, maxBestCount);
  };

  const bestCommentsA = getBestComments(commentsA);
  const bestCommentsB = getBestComments(commentsB);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 헤더 버튼 */}
        <div>
          <Link href="/board/debate" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            &larr; 돌아가기
          </Link>
        </div>

        {/* 논제 헤더 및 투표 현황 */}
        <VoteSection 
          topic={topic}
          userStance={userStance}
          handleVote={handleVote}
          handleDeleteTopic={handleDeleteTopic}
          openReportModal={openReportModal}
          currentUser={currentUser}
          onSoftDeleteByAdmin={handleSoftDeleteByAdmin}
        />

        {/* 50:50 분할 댓글 영역 */}
        <DebateCommentSection
          userStance={userStance}
          newComment={newComment}
          setNewComment={setNewComment}
          handleAddComment={handleAddComment}
          isSubmitting={isSubmitting}
          bestCommentsA={bestCommentsA}
          commentsA={commentsA}
          bestCommentsB={bestCommentsB}
          commentsB={commentsB}
          topicAuthorId={topic.authorId as string}
        />

      </div>
    </div>
  );
}

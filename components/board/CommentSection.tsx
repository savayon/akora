import React, { useState } from 'react';
import Link from 'next/link';
import { BoardComment } from '@/types';
import { CommentItem } from '@/components/CommentItem';
import { CloseIcon } from '@/components/icons';
import { useAppStore } from '@/store/useAppStore';
import { commentRepository, proposalRepository, notificationRepository } from '@/repositories';

type CommentSectionProps = {
  initialComments: BoardComment[];
  postAuthor?: string;
  postAuthorId?: string;
  isDiscussBoard?: boolean;
  postId: string;
  postTitle?: string;
};

export const CommentSection: React.FC<CommentSectionProps> = ({ initialComments, postAuthor, postAuthorId, isDiscussBoard = false, postId, postTitle }) => {
  const [comments, setComments] = useState(initialComments);
  const [topLevelText, setTopLevelText] = useState('');
  const [isTopLevelProposal, setIsTopLevelProposal] = useState(false);

  const { currentUser, setDraftDebate, addNotification, setIsLoginModalOpen } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTopLevelSubmit = async () => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!topLevelText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const created = await commentRepository.createComment(
        postId, 
        topLevelText, 
        undefined, 
        isTopLevelProposal ? 'proposal' : 'normal'
      ) as BoardComment;

      if (isTopLevelProposal && postAuthor) {
        created.targetUserName = postAuthor;
        created.debateStatus = 'pending';
        created.watchCount = 0;
        
        let proposalId = '';
        try {
          const proposal = await proposalRepository.createProposal({
            targetName: postAuthor,
            sourceType: 'comment',
            sourceId: created.id,
            topic: postTitle ? `'${postTitle.length > 20 ? postTitle.substring(0, 20) + '...' : postTitle}' 관련 논쟁` : '게시글에 대한 논쟁',
            claim: topLevelText,
            excerpt: postTitle ? `[제목] ${postTitle}` : '게시글 본문'
          });
          proposalId = String(proposal.id);
        } catch (err) {
          console.error(err);
        }

        if (postAuthorId && postAuthorId !== currentUser.id) {
          notificationRepository.createNotification(postAuthorId, {
            type: isTopLevelProposal ? 'proposal_received' : 'turn_arrived',
            icon: isTopLevelProposal ? '💡' : '💬',
            message: isTopLevelProposal
              ? `${currentUser.name}님이 회원님의 게시글에 1:1 토론을 제안했습니다!`
              : `${currentUser.name}님이 회원님의 게시글에 댓글을 남겼습니다.`,
            subtext: `"${topLevelText.substring(0, 20)}..."`,
            link: isTopLevelProposal ? `/debate-request/${proposalId}` : `/board/${isDiscussBoard ? 'discuss' : 'free'}/${postId}`
          }).catch((e: any) => {
            console.error(e);
            window.alert('알림 생성 에러: ' + e.message);
          });
        }
      }

      setComments([created, ...comments]);
      setTopLevelText('');
      setIsTopLevelProposal(false);
    } catch (e: any) {
      alert(e.message || '댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleTopLevelSubmit();
    }
  };

  const handleSubmitReply = async (commentId: string | number, content: string, isProposal: boolean) => {
    if (!currentUser.id) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      const parentComment = getAllComments(comments).find(c => String(c.id) === String(commentId));
      const targetUserId = parentComment?.authorId || undefined;
      
      const created = await commentRepository.createComment(
        postId, 
        content, 
        String(commentId), 
        isProposal ? 'proposal' : 'normal',
        targetUserId
      ) as BoardComment;

      let proposalId = '';
      if (isProposal) {
        try {
          const proposal = await proposalRepository.createProposal({
            targetName: parentComment?.author || '',
            sourceType: 'comment',
            sourceId: created.id,
            topic: parentComment?.author ? `${parentComment.author}님의 발언에 대한 논쟁` : '이전 발언에 대한 논쟁',
            claim: content,
            excerpt: parentComment?.content || ''
          });
          proposalId = String(proposal.id);
        } catch (err) {
          console.error(err);
        }
      }

      if (parentComment?.authorId && parentComment.authorId !== currentUser.id) {
        notificationRepository.createNotification(parentComment.authorId, {
          type: isProposal ? 'proposal_received' : 'turn_arrived',
          icon: isProposal ? '💡' : '💬',
          message: isProposal
            ? `${currentUser.name}님이 회원님의 댓글에 1:1 토론을 제안했습니다!`
            : `${currentUser.name}님이 회원님의 댓글에 답글을 남겼습니다.`,
          subtext: `"${content.substring(0, 20)}..."`,
          link: isProposal ? `/debate-request/${proposalId}` : `/board/${isDiscussBoard ? 'discuss' : 'free'}/${postId}`
        }).catch((e: any) => {
          console.error(e);
          window.alert('알림 생성 에러: ' + e.message);
        });
      }
      
      const processComments = (commentList: BoardComment[]): BoardComment[] => {
        return commentList.map(c => {
          if (String(c.id) === String(commentId)) {
            const newReply = { ...created };
            
            if (isProposal) {
              newReply.targetUserName = c.author;
              newReply.debateStatus = 'pending';
              newReply.watchCount = 0;
              
              proposalRepository.createProposal({
                targetName: c.author,
                sourceType: 'comment',
                sourceId: created.id,
                topic: content.substring(0, 30) + '...',
                claim: content,
                excerpt: c.content.substring(0, 30) + '...'
              }).catch(console.error);

              if (c.authorId) {
                // 알림은 위에서 일괄 처리
              }
            }
            
            return {
              ...c,
              replies: [...(c.replies || []), newReply]
            };
          }
          
          if (c.replies) {
            return {
              ...c,
              replies: processComments(c.replies)
            };
          }
          
          return c;
        });
      };
      
      setComments(processComments(comments));
    } catch (e: any) {
      alert(e.message || '답글 작성에 실패했습니다.');
    }
  };

  // 베스트 댓글 1개 추출 로직 (대댓글 포함)
  const getAllComments = (commentsList: BoardComment[]) => {
    const all: BoardComment[] = [];
    commentsList.forEach(c => {
      all.push(c);
      if (c.replies) {
        all.push(...(c.replies as BoardComment[]));
      }
    });
    return all;
  };

  const visibleComments = comments;

  const allComments = getAllComments(visibleComments);
  const bestComment = allComments.filter(c => c.likes > 0).sort((a, b) => b.likes - a.likes)[0];

  return (
    <section className="mb-20">
      <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
        댓글 <span className="text-yellow-500">{comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)}</span>
      </h3>

      {/* 댓글 입력 폼 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 transition-all">
        {isTopLevelProposal && postAuthor && (
          <div className="mb-3 text-sm text-slate-700">
            <span className="font-bold">{currentUser.name}</span>님이 <span className="font-bold">{postAuthor}</span>님에게
            <div className="mt-1">
              <span className="inline-block bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-xs mr-2">게시글 내용으로 토론을 제안했습니다!</span>
            </div>
          </div>
        )}
        <textarea 
          value={topLevelText}
          onChange={(e) => setTopLevelText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글을 남겨주세요. 타인에 대한 비방은 제재될 수 있습니다. (Enter를 눌러 등록)"
          className="w-full min-h-[100px] bg-transparent resize-none outline-none text-slate-800 text-sm md:text-base placeholder:text-slate-400"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
          {!isDiscussBoard && postAuthorId !== currentUser.id ? (
            <button 
              onClick={() => setIsTopLevelProposal(!isTopLevelProposal)}
              className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                isTopLevelProposal 
                  ? 'bg-purple-600 text-white border border-purple-600 hover:bg-purple-700' 
                  : 'text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <span>📖</span> 토론 제안하기
            </button>
          ) : (
            <div />
          )}
          
          <button 
            disabled={isSubmitting}
            onClick={handleTopLevelSubmit}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>

      {/* 베스트 댓글 */}
      {bestComment && (
        <div className="mb-6 space-y-2 relative">
          <div className="absolute -left-4 -top-2 w-1.5 h-6 bg-yellow-400 rounded-r"></div>
          <h4 className="text-xs font-black text-yellow-600 mb-2">🔥 베스트 댓글</h4>
          <CommentItem 
            comment={bestComment}
            isBest={true}
            isTopBestCard={true}
            onSubmitReply={handleSubmitReply}
            isDiscussBoard={isDiscussBoard}
            postAuthorId={postAuthorId}
          />
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {visibleComments.map(function renderCommentNode(comment) {
          return (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              onSubmitReply={handleSubmitReply}
              isDiscussBoard={isDiscussBoard}
              postAuthorId={postAuthorId}
            >
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 md:ml-10 mt-3 space-y-3">
                  {comment.replies.map(renderCommentNode)}
                </div>
              )}
            </CommentItem>
          );
        })}
      </div>

    </section>
  );
};

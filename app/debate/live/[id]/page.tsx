"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { UserBadge, UserAvatar } from '@/components/UserBadge';
import { SummaryCard } from '@/components/SummaryCard';
import { useDebateRoom } from '@/hooks/useDebateRoom';
import { LiveReactionPanel } from '@/components/debate/LiveReactionPanel';
import { DebateInput } from '@/components/debate/DebateInput';
import JurorSubmissionPanel from '@/components/debate/JurorSubmissionPanel';
import VerdictResultBoard from '@/components/debate/VerdictResultBoard';
import { useAppStore } from '@/store/useAppStore';
import { useCountdown } from '@/hooks/useCountdown';
import { useEffect } from 'react';
import { SupabaseDebateRepository } from '@/repositories/supabase/DebateRepository';
import { preVoteRepository } from '@/repositories';
import { ContentRenderer } from '@/components/ContentRenderer';
import { TopicChangeControls } from '@/components/debate/TopicChangeControls';

export default function DebateRoomPage() {
  const { openReportModal, currentUser, setIsLoginModalOpen } = useAppStore();
  const params = useParams();
  const debateId = params.id as string;
  const {
    debateMeta,
    isLoading,
    role,
    hasPreVoted, setHasPreVoted,
    showPreVoteModal, setShowPreVoteModal,
    isFullView,
    turns,
    liveComments, setLiveComments,
    currentTurnOwner,
    inputValue, setInputValue,
    replyTarget, setReplyTarget,
    chatBottomRef,
    selectionPopup,
    chatPage, setChatPage,
    itemsPerPage,
    totalChatPages,
    handleMouseUp,
    handlePartialQuote,
    handleSubmit,
    handleSubmitClaim,
    handleKeyDown,
    handleEndDebate,
    handleScrollToTarget,
    handleLikeTurn,
    refreshDebateMeta,
    hasJudged,
    judgmentsData,
    refreshJudgments
  } = useDebateRoom(debateId);

  // 사전투표 핸들러
  const handlePreVote = async (stance: 'proposer' | 'responder') => {
    if (!currentUser?.id) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      await preVoteRepository.submitPreVote(debateId, currentUser.id, stance);
      setHasPreVoted(true);
      setShowPreVoteModal(false);
      alert('투표가 완료되었습니다.');
    } catch (e: any) {
      alert(e.message || '투표 처리 중 오류가 발생했습니다.');
    }
  };

  // 1시간 준비 기한 (생성 시간 기준 + 1시간)
  const { timeLeft: prepareTimeLeft, isExpired: isPrepareExpired } = useCountdown(debateMeta?.createdAt || '', 1 * 60 * 60 * 1000);

  // 턴 답변 기한 (마지막 턴이 생성된 시간 기준 + 12시간, 없으면 토론 생성 시간 기준)
  const lastTurnTime = turns.length > 0 ? turns[turns.length - 1].createdAt : debateMeta?.createdAt;
  const { timeLeft: turnTimeLeft, isExpired: isTurnExpired } = useCountdown(lastTurnTime || '', 12 * 60 * 60 * 1000);
  
  const isExpired = debateMeta?.status === 'preparing' ? isPrepareExpired : isTurnExpired;
  
  // 판정 기한 (judging_ends_at 기준)
  const { timeLeft: judgingTimeLeft, isExpired: isJudgingExpired } = useCountdown(debateMeta?.judgingEndsAt || '', 0);

  const isDebateEnded = debateMeta?.status === 'judging' || debateMeta?.status === 'completed';
  const effectiveIsFullView = isFullView || isDebateEnded;
  const isForfeitedOrAbandoned = debateMeta?.endedReason === 'forfeit' || debateMeta?.endedReason === 'abandoned';

  // 기권패 처리 로직 (Preparing 단계 타임아웃)
  useEffect(() => {
    if (debateMeta?.status === 'preparing' && isPrepareExpired && !(debateMeta.proposerClaim && debateMeta.responderClaim)) {
      const hasProposerClaim = !!debateMeta.proposerClaim;
      const hasResponderClaim = !!debateMeta.responderClaim;
      
      let loserRole: 'proposer' | 'responder' | 'both' = 'both';
      if (hasProposerClaim && !hasResponderClaim) loserRole = 'responder';
      else if (!hasProposerClaim && hasResponderClaim) loserRole = 'proposer';

      SupabaseDebateRepository.markAsForfeitLoss(debateId, loserRole).then(() => {
        // 새로고침을 유도하여 상태 업데이트 반영
        window.location.reload();
      });
    }
  }, [debateMeta?.status, isPrepareExpired, debateMeta?.proposerClaim, debateMeta?.responderClaim, debateId]);

  // 12시간 경과 감지 시 Lazy Update
  useEffect(() => {
    if (isExpired && debateMeta?.status === 'in_progress') {
      SupabaseDebateRepository.markAsTimeoutLoss(debateId, currentTurnOwner).then(() => {
        refreshDebateMeta();
      }).catch(console.error);
    }
  }, [isExpired, debateMeta?.status, debateId, currentTurnOwner, refreshDebateMeta]);

  // 로그인 상태 체크하여 비회원일 경우 로그인 팝업 띄우기
  useEffect(() => {
    if (!isLoading && debateMeta && !currentUser.id) {
      setIsLoginModalOpen(true);
    }
  }, [isLoading, debateMeta, currentUser.id, setIsLoginModalOpen]);

  if (isLoading || !debateMeta) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 font-medium">토론 데이터를 불러오는 중입니다...</div>;
  }

  // 발언 카드 렌더링
  const renderTurnCard = (turn: any) => {
    const isProposer = turn.authorRole === 'proposer';
    
    const isMyTurn = role !== 'viewer' && turn.authorRole === role;
    
    let alignmentClass = '';
    let reverseLayout = false;

    if (role === 'viewer') {
      alignmentClass = isProposer ? 'ml-auto' : 'mr-auto';
      reverseLayout = isProposer;
    } else {
      alignmentClass = isMyTurn ? 'ml-auto' : 'mr-auto';
      reverseLayout = isMyTurn;
    }

    const canReply = !isDebateEnded && role === currentTurnOwner;

    return (
      <div 
        id={`turn-${turn.id}`} 
        key={turn.id} 
        className={`w-full max-w-[90%] md:max-w-[85%] ${alignmentClass} animate-in fade-in group relative`}
        // 부분 인용을 위한 데이터 속성 부여
        data-turn-id={turn.id}
        data-turn-num={turn.turnNum}
        data-author-name={turn.authorName}
      >
        <div className={`flex items-center gap-2 mb-2 px-1 ${reverseLayout ? 'flex-row-reverse' : ''}`}>
          <UserAvatar name={turn.authorName} uuid={isProposer ? debateMeta.proposerId : debateMeta.responderId} avatarUrl={turn.authorAvatarUrl} size="w-6 h-6" iconSize="w-4 h-4" containerClass={isProposer ? 'border border-orange-200 bg-white shadow-sm' : 'border border-blue-200 bg-white shadow-sm'} />
          <span className="font-bold text-slate-700 text-sm">{turn.authorName}</span>
          <span className="text-xs text-slate-400 font-medium">Round {turn.turnNum} • {turn.time}</span>
          
          {/* 전체 발언 인용 버튼 */}
          {canReply && (
            <button 
              onClick={() => {
                setReplyTarget({
                  quotedTurnId: turn.id,
                  quotedTurnNum: turn.turnNum,
                  quotedAuthorName: turn.authorName,
                  quotedExcerpt: turn.content.length > 50 ? turn.content.substring(0, 50) + '...' : turn.content
                });
                window.getSelection()?.removeAllRanges();
              }}
              className={`flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-white shadow-sm px-2.5 py-1 rounded-full border border-slate-200 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50 transition-all opacity-70 group-hover:opacity-100 focus:opacity-100 ${reverseLayout ? 'mr-auto' : 'ml-auto'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              전체 인용
            </button>
          )}
        </div>
        
        <div className={`bg-white border-t-4 shadow-sm p-4 md:p-5 rounded-b-xl ${reverseLayout ? 'rounded-tl-xl' : 'rounded-tr-xl'} ${isProposer ? 'border-orange-400' : 'border-blue-500'}`}>
          
          {turn.quotedTurnId && (
            <div 
              onClick={() => handleScrollToTarget(turn.quotedTurnId!)}
              className="relative overflow-hidden bg-slate-50 border border-slate-200 p-3 mb-3 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group/quote"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 group-hover/quote:bg-purple-400 transition-colors"></div>
              <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 mb-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                Round {turn.quotedTurnNum} • {turn.quotedAuthorName}의 발언 인용
              </div>
              <p className="text-slate-600 text-[13px] md:text-sm font-medium leading-snug line-clamp-2">"{turn.quotedExcerpt}"</p>
            </div>
          )}

          <div className="text-slate-800 text-[14px] md:text-[15px] leading-relaxed selection:bg-purple-200 selection:text-purple-900">
            <ContentRenderer content={turn.content} disablePreview={true} />
          </div>

          {/* 발언 추천 표시 및 버튼 */}
          {(role === 'viewer' || isDebateEnded) && (
            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={() => openReportModal('comment', turn.id)}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 shadow-sm hover:bg-slate-100 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                🚨 신고
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`flex flex-col min-h-screen bg-slate-50 relative pb-10`}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      

      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 z-40 shadow-sm relative">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200">1:1 구조화 토론</span>
              {!isDebateEnded ? (
                <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 animate-pulse">LIVE 진행중</span>
              ) : (
                <span className="text-[10px] font-black bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">토론 종료됨</span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h1 className="text-xl font-black text-slate-900 leading-snug">{debateMeta.topic}</h1>
              
              <span className={`text-[11px] font-black px-2.5 py-1 rounded border ${
                debateMeta?.status === 'judging'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  : debateMeta?.status === 'completed'
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-green-100 text-green-700 border-green-200'
              }`}>
                {debateMeta?.status === 'judging' ? '판정중' : debateMeta?.status === 'completed' ? '종료' : '진행중'}
              </span>

              {debateMeta?.status === 'judging' && !isJudgingExpired && (
                <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 animate-pulse">
                  남은 시간: {judgingTimeLeft}
                </span>
              )}
              {debateMeta?.status === 'judging' && isJudgingExpired && (
                <span className="text-[11px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200">
                  판정 마감
                </span>
              )}

              {debateMeta.topicStatus === 'waiting' || debateMeta.topicStatus === 'generating' ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-purple-100 text-purple-700 px-2.5 py-1 rounded border border-purple-200">
                  <span className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                  토론 주제 정의중...
                </span>
              ) : debateMeta.topicStatus === 'failed' && (debateMeta.status === 'preparing' || debateMeta.status === 'in_progress') ? (
                <span className="text-[11px] font-black px-2.5 py-1 rounded border bg-red-50 text-red-600 border-red-200">
                  AI 주제 생성 실패
                </span>
              ) : null}
            </div>

            <div className="relative flex justify-end -mt-1 mb-2">
              <TopicChangeControls
                debate={debateMeta}
                role={role}
                currentUserId={currentUser.id}
                onChanged={refreshDebateMeta}
              />
            </div>
            
            <Link href={debateMeta.originUrl} className="block bg-slate-50 hover:bg-slate-100 border-l-4 border-slate-300 p-2.5 rounded-r text-sm transition-colors group">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                이 토론의 발원지 확인하기 <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600">&rarr;</span>
              </div>
              <p className="text-slate-600 italic line-clamp-2">
                {debateMeta.originType === 'post' && <span className="inline-block bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] mr-1 not-italic font-bold">게시판</span>}
                {debateMeta.originType === 'comment' && <span className="inline-block bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] mr-1 not-italic font-bold">댓글</span>}
                {debateMeta.originType === 'topic' && <span className="inline-block bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] mr-1 not-italic font-bold">토론게시판</span>}
                "{debateMeta.originPreview}"
              </p>
            </Link>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl shadow-inner mt-2 md:mt-0">
            <div className="flex items-center flex-col min-w-[60px] gap-1">
              <UserAvatar uuid={debateMeta.responderId} name={debateMeta.responderName} avatarUrl={debateMeta.responderAvatarUrl} size="w-10 h-10" iconSize="w-7 h-7" containerClass="border-2 border-blue-400 shadow-sm" />
              <span className="text-sm font-black text-blue-600">{debateMeta.responderName}</span>
            </div>
            <div className="text-xs font-black text-slate-300 italic">VS</div>
            <div className="flex items-center flex-col min-w-[60px] gap-1">
              <UserAvatar uuid={debateMeta.proposerId} name={debateMeta.proposerName} avatarUrl={debateMeta.proposerAvatarUrl} size="w-10 h-10" iconSize="w-7 h-7" containerClass="border-2 border-orange-400 shadow-sm" />
              <span className="text-sm font-black text-orange-600">{debateMeta.proposerName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative ${effectiveIsFullView ? 'max-w-[1400px] grid grid-cols-1 lg:grid-cols-3 gap-6' : 'max-w-4xl'}`}>
        
        {/* 사전투표 오버레이 */}
        {showPreVoteModal && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-50/30 backdrop-blur-[2px]">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-300 w-full max-w-lg border border-slate-700/50 mx-4">
              <span className="text-5xl drop-shadow-md">👀</span>
              <div className="text-center space-y-1.5">
                <p className="font-black text-2xl tracking-tight">어느 주장에 동의하시나요?</p>
                <p className="text-sm font-medium text-slate-300">투표 후 양측의 치열한 토론을 관전해보세요.</p>
              </div>

              <div className="flex w-full items-stretch gap-3 mt-4 bg-slate-800/50 p-2 rounded-2xl">
                <button
                  onClick={() => handlePreVote('responder')}
                  className="flex-1 flex flex-col items-center justify-center gap-2 bg-slate-800/80 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 p-4 rounded-xl transition-all group"
                >
                  <span className="text-xs font-bold text-slate-400 group-hover:text-blue-200">{debateMeta.responderName}의 주장</span>
                  <span className="text-sm font-black text-white line-clamp-2 leading-tight">
                    "{debateMeta.responderClaim || '주장 없음'}"
                  </span>
                </button>
                <div className="flex items-center justify-center px-1">
                  <span className="text-xs font-black text-slate-500 italic">VS</span>
                </div>
                <button
                  onClick={() => handlePreVote('proposer')}
                  className="flex-1 flex flex-col items-center justify-center gap-2 bg-slate-800/80 hover:bg-orange-600 border border-slate-700 hover:border-orange-500 p-4 rounded-xl transition-all group"
                >
                  <span className="text-xs font-bold text-slate-400 group-hover:text-orange-200">{debateMeta.proposerName}의 주장</span>
                  <span className="text-sm font-black text-white line-clamp-2 leading-tight">
                    "{debateMeta.proposerClaim || '주장 없음'}"
                  </span>
                </button>
              </div>
              
              <div className="mt-2 text-center w-full">
                <button 
                  onClick={() => window.history.back()}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  이전으로 돌아가기 &gt;
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`transition-all duration-300 ${showPreVoteModal ? 'blur-[3px] opacity-60 select-none pointer-events-none' : ''} ${effectiveIsFullView ? 'lg:col-span-2 flex flex-col' : ''}`}>
        
        {isDebateEnded ? (
          isForfeitedOrAbandoned ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 max-w-2xl mx-auto mt-12">
              <div className="bg-white border-t-4 border-red-500 rounded-2xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">토론이 취소되었습니다</h2>
                <p className="text-slate-600 font-medium mb-6">
                  {debateMeta.endedReason === 'abandoned' 
                    ? '토론 당사자의 탈퇴 등으로 인해 토론이 취소되었습니다.' 
                    : (!debateMeta.timeoutLoserRole || debateMeta.timeoutLoserRole === 'both' 
                        ? '양측 모두 제한 시간 내에 공식 주장을 설정하지 않아 토론이 무효 처리되었습니다.' 
                        : `${debateMeta.timeoutLoserRole === 'proposer' ? debateMeta.proposerName : debateMeta.responderName}님이 제한 시간 내에 공식 주장을 설정하지 않아 기권패 처리되었습니다.`)}
                </p>
                <Link href="/board/debate" className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm">
                  토론게시판으로 돌아가기
                </Link>
              </div>
            </div>
          ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            
            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="text-center mb-8">
                <span className="inline-block bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full mb-3">STEP 1</span>
                <h2 className="text-2xl font-black text-slate-900">양측의 3줄 요약</h2>
                <p className="text-slate-500 text-sm mt-2">긴 글을 읽기 전, 양측의 핵심 주장을 먼저 파악하세요.</p>
              </div>

              {(isExpired || debateMeta?.endedReason === 'timeout') && (
                <div className="mb-8 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-center font-bold animate-in fade-in zoom-in duration-300">
                  ⏳ 답변 기한이 만료되어 <span className="font-black text-red-800 text-lg">{(debateMeta?.timeoutLoserRole || currentTurnOwner) === 'proposer' ? debateMeta.proposerName : debateMeta.responderName}</span>님의 시간패로 토론이 종료되었습니다.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SummaryCard summary={{
                  nickname: debateMeta.responderName,
                  uuid: debateMeta.responderId,
                  avatarUrl: debateMeta.responderAvatarUrl,
                  side: 'responder',
                  points: turns.find(t => t.authorRole === 'responder')
                    ? turns.find(t => t.authorRole === 'responder')!.content.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3)
                    : ['아직 주장을 펼치지 않았습니다.']
                }} />
                <SummaryCard summary={{
                  nickname: debateMeta.proposerName,
                  uuid: debateMeta.proposerId,
                  avatarUrl: debateMeta.proposerAvatarUrl,
                  side: 'proposer',
                  points: turns.find(t => t.authorRole === 'proposer')
                    ? turns.find(t => t.authorRole === 'proposer')!.content.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3)
                    : ['아직 주장을 펼치지 않았습니다.']
                }} />
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="text-center mb-6">
                <span className="inline-block bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full mb-3">STEP 2</span>
                <h2 className="text-2xl font-black text-slate-900">전체 토론 기록 확인</h2>
                <p className="text-slate-500 text-sm mt-2">상대방의 논리를 어떻게 반박했는지 상세한 대화를 확인하세요.</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-6 mb-4 min-h-[400px] flex flex-col justify-between">
                <div className="space-y-6">
                  {turns.slice(chatPage * itemsPerPage, chatPage * itemsPerPage + itemsPerPage).map(turn => renderTurnCard(turn))}
                </div>
                
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => setChatPage(Math.max(0, chatPage - 1))}
                    disabled={chatPage === 0}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    &larr; 이전 3개
                  </button>
                  <span className="text-xs font-bold text-slate-400">
                    페이지 {chatPage + 1} / {totalChatPages}
                  </span>
                  <button 
                    onClick={() => setChatPage(Math.min(totalChatPages - 1, chatPage + 1))}
                    disabled={chatPage === totalChatPages - 1}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    다음 3개 &rarr;
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-8">

              {debateMeta?.status === 'judging' && !hasJudged && (role === 'viewer') && (
                <JurorSubmissionPanel 
                  debate={debateMeta} 
                  onSubmitted={() => refreshJudgments()} 
                />
              )}
              {debateMeta?.status === 'completed' && (
                <VerdictResultBoard 
                  debate={debateMeta} 
                  judgments={judgmentsData.judgments} 
                />
              )}
              {debateMeta?.status === 'judging' && hasJudged && (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center mb-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">판정 참여 완료</h3>
                  <p className="text-blue-600">
                    다른 배심원들의 판정이 모일 때까지 기다려주세요.<br/>
                    (현재 {judgmentsData.currentCount} / {judgmentsData.requiredCount}명 참여)
                  </p>
                </div>
              )}
              {debateMeta?.status === 'judging' && !hasJudged && (role === 'proposer' || role === 'responder') && (
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">판정 진행 중</h3>
                  <p className="text-slate-600">
                    관전자(배심원)들이 승패를 판정하고 있습니다.<br/>
                    (현재 {judgmentsData.currentCount} / {judgmentsData.requiredCount}명 참여)
                  </p>
                </div>
              )}
            </section>

          </div>
          )
        ) : (
          <div className="space-y-8">
            {turns.map(turn => renderTurnCard(turn))}

            {!isDebateEnded && (
              <div className="flex items-center justify-center py-6 animate-pulse">
                <div className="bg-white shadow-sm rounded-full px-5 py-2.5 flex items-center gap-3 border border-slate-200">
                  <span className="text-xl">⏳</span>
                  <span className="text-sm font-bold text-slate-600">
                    {role === currentTurnOwner ? (
                      <><span className="font-black text-slate-800">당신의</span> 답변 차례입니다! 서둘러 작성해주세요.</>
                    ) : (
                      <><span className="font-black text-slate-800">{currentTurnOwner === 'proposer' ? debateMeta.proposerName : debateMeta.responderName}</span>님이 신중하게 답변을 작성 중입니다...</>
                    )}
                  </span>
                  <span className="text-xs font-black text-slate-400 ml-2">(답변 기한 {turnTimeLeft})</span>
                </div>
              </div>
            )}
             {/* isDebateEnded and role !== 'viewer' text-center logic has been moved outside or we just don't need it because it's replaced by the 3-step UI */}
            <div ref={chatBottomRef} className="h-4" style={{ scrollMarginBottom: '160px' }} />
          </div>
        )}
        
        </div> {/* End of left column */}

        <div className={`transition-all duration-300 ${showPreVoteModal ? 'blur-[3px] opacity-60 select-none pointer-events-none' : ''}`}>
          <LiveReactionPanel 
            debateId={debateId}
            isFullView={effectiveIsFullView}
            role={role} 
            comments={liveComments}
            spectatorCount={debateMeta?.spectatorCount || 0}
            onCommentAdded={(newComment) => setLiveComments(prev => [newComment, ...prev])}
          />
        </div>
      </main>

      {/* 텍스트 드래그(선택) 시 띄워주는 부분 인용 팝업 */}
      {selectionPopup && (
        <div 
          className="fixed z-[100] animate-in zoom-in-95 duration-150 pointer-events-auto"
          style={{ 
            left: selectionPopup.x, 
            top: selectionPopup.y, 
            transform: 'translate(-50%, -100%)' // 마우스 포인터 정가운데 위쪽
          }}
        >
          <div className="bg-slate-900 text-white shadow-xl rounded-lg flex flex-col overflow-hidden border border-slate-700">
            <div className="px-3 py-2 border-b border-slate-700 max-w-xs bg-slate-800">
              <p className="text-xs text-slate-300 font-medium line-clamp-2 italic">"{selectionPopup.text}"</p>
            </div>
            <button 
              onClick={handlePartialQuote}
              className="flex items-center justify-center gap-1.5 px-4 py-2 hover:bg-slate-800 transition-colors text-sm font-bold text-purple-300 w-full"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              이 부분만 인용하기
            </button>
          </div>
          {/* 말풍선 꼬리 */}
          <div className="w-3 h-3 bg-slate-900 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-slate-700"></div>
        </div>
      )}

      {/* 입력 영역 */}
      {/* 입력 영역 (준비 중일 때 하단 플레이스홀더) */}
      {debateMeta.status === 'preparing' ? (
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-6 z-40 sticky bottom-0">
          <div className="max-w-4xl mx-auto text-center">
            <div className="py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-medium">
              {(role === 'proposer' && debateMeta.proposerClaim) || (role === 'responder' && debateMeta.responderClaim) ? (
                <>
                  <span className="text-green-600 font-bold">✅ 내 주장 제출 완료</span><br/>
                  ⏳ 상대방의 제출을 기다리는 중입니다...
                </>
              ) : (
                <>
                  ⏳ 토론 당사자들이 공식 주장을 작성 중입니다...<br/>
                  <span className="text-sm mt-2 block">1시간 내에 주장이 모두 제출되면 본격적인 토론이 시작됩니다.</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <DebateInput
          role={role}
          isDebateEnded={isDebateEnded}
          currentTurnOwner={currentTurnOwner}
          replyTarget={replyTarget}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleKeyDown={handleKeyDown}
          handleSubmit={handleSubmit}
          handleEndDebate={handleEndDebate}
          setReplyTarget={setReplyTarget}
        />
      )}

      {/* 공식 주장 제출 모달 */}
      {debateMeta.status === 'preparing' && role !== 'viewer' && !(role === 'proposer' && debateMeta.proposerClaim) && !(role === 'responder' && debateMeta.responderClaim) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 relative">
            <div className="bg-yellow-200 px-6 py-5 text-center relative">
              <h2 className="text-xl font-black text-slate-900 mb-1">🗣️ 공식 주장 작성</h2>
              <p className="text-slate-800 text-sm">상대방을 설득할 20자 이내의 핵심 주장을 입력해주세요.</p>
            </div>
            
            <div className="p-6 bg-slate-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-600">제출 마감까지 남은 시간</span>
                <span className="text-sm font-black text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 animate-pulse">
                  {prepareTimeLeft || "계산 중..."}
                </span>
              </div>
              <input 
                type="text"
                maxLength={20}
                placeholder="20자 이내로 핵심 주장을 작성해주세요."
                className="w-full bg-white border border-slate-300 rounded-xl p-4 outline-none focus:border-yellow-300 focus:ring-4 focus:ring-yellow-300/20 transition-all font-bold text-center text-slate-800 placeholder:font-normal"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <div className="text-right mt-1.5 text-xs font-bold">
                <span className={inputValue.length >= 20 ? "text-red-500" : "text-slate-500"}>{inputValue.length}</span> <span className="text-slate-400">/ 20자</span>
              </div>
              
              <button 
                onClick={() => {
                  if (!inputValue.trim()) return alert('주장을 입력해주세요.');
                  handleSubmitClaim(inputValue);
                  setInputValue('');
                }}
                className="w-full mt-4 bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-black px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                주장 확정 및 제출하기
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}

"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { UserBadge, UserAvatar } from '@/components/UserBadge';
import { SummaryCard } from '@/components/SummaryCard';
import { useDebateRoom } from '@/hooks/useDebateRoom';
import { LiveReactionPanel } from '@/components/debate/LiveReactionPanel';
import { DebateInput } from '@/components/debate/DebateInput';
import { VotingSection } from '@/components/debate/VotingSection';
import { useAppStore } from '@/store/useAppStore';
import { useCountdown } from '@/hooks/useCountdown';

export default function DebateRoomPage() {
  const { openReportModal } = useAppStore();
  const params = useParams();
  const debateId = params.id as string;
  const {
    debateMeta,
    isLoading,
    role,
    isDebateEnded, setIsDebateEnded,
    hasVoted, setHasVoted,
    showSummaryModal, setShowSummaryModal,
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
    handleKeyDown,
    handleEndDebate,
    handleScrollToTarget,
    handleVote,
    handleLikeTurn,
    likedTurns,
    voteStats
  } = useDebateRoom(debateId);

  // 턴 답변 기한 (마지막 턴이 생성된 시간 기준 + 24시간, 없으면 토론 생성 시간 기준)
  const lastTurnTime = turns.length > 0 ? turns[turns.length - 1].createdAt : debateMeta?.createdAt;
  const { timeLeft: turnTimeLeft } = useCountdown(lastTurnTime || '', 24 * 60 * 60 * 1000);

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

          <p className="text-slate-800 text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap selection:bg-purple-200 selection:text-purple-900">
            {turn.content}
          </p>

          {/* 발언 추천 표시 및 버튼 */}
          {(role === 'viewer' || isDebateEnded) && (
            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={() => openReportModal('comment', turn.id)}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 shadow-sm hover:bg-slate-100 hover:text-red-500 hover:border-red-200 transition-colors"
              >
                🚨 신고
              </button>
              <button 
                disabled={role !== 'viewer'}
                onClick={() => handleLikeTurn(turn.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors ${
                  role === 'viewer' ? 'cursor-pointer' : 'cursor-default opacity-80'
                } ${
                  likedTurns[turn.id] 
                    ? 'bg-red-50 text-red-500 border border-red-300' 
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-red-500 hover:border-red-200 group/like'
                }`}
              >
                <svg className={`w-4 h-4 ${role === 'viewer' && !likedTurns[turn.id] ? 'group-hover/like:scale-110 transition-transform' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" /></svg>
                {likedTurns[turn.id] ? 1 : 0}
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
            
            <h1 className="text-xl font-black text-slate-900 leading-snug mb-3">{debateMeta.topic}</h1>
            
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

      <main className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isFullView ? 'max-w-[1400px] grid grid-cols-1 lg:grid-cols-3 gap-6' : 'max-w-4xl'}`}>
        
        <div className={isFullView ? 'lg:col-span-2 flex flex-col' : ''}>
        
        {isDebateEnded ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
            
            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="text-center mb-8">
                <span className="inline-block bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full mb-3">STEP 1</span>
                <h2 className="text-2xl font-black text-slate-900">양측의 3줄 요약</h2>
                <p className="text-slate-500 text-sm mt-2">긴 글을 읽기 전, 양측의 핵심 주장을 먼저 파악하세요.</p>
              </div>

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

            <VotingSection role={role} hasVoted={hasVoted} onVote={handleVote} debateMeta={debateMeta} voteStats={voteStats} />

          </div>
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

        <LiveReactionPanel 
          debateId={debateId}
          isFullView={isFullView} 
          role={role} 
          comments={liveComments} 
          voteStats={voteStats}
          onCommentAdded={(newComment) => setLiveComments(prev => [newComment, ...prev])}
        />
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

      {showSummaryModal && role !== 'viewer' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 px-6 py-5">
              <h2 className="text-xl font-black text-white mb-1">토론이 성공적으로 종료되었습니다! 🎉</h2>
              <p className="text-slate-300 text-sm">관전자들이 당신의 주장을 한눈에 이해할 수 있도록,<br/>지금까지의 발언을 3줄로 요약해 주세요.</p>
            </div>
            
            <div className="p-6 space-y-4 bg-slate-50">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">첫 번째 핵심 근거</label>
                <input type="text" placeholder="가장 강력한 첫 번째 주장을 요약해 주세요." className="w-full border border-slate-300 rounded p-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">두 번째 핵심 근거</label>
                <input type="text" placeholder="주장을 뒷받침하는 두 번째 근거를 요약해 주세요." className="w-full border border-slate-300 rounded p-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">세 번째 핵심 근거</label>
                <input type="text" placeholder="마지막으로 관전자를 설득할 핵심을 요약해 주세요." className="w-full border border-slate-300 rounded p-2.5 text-sm outline-none focus:border-yellow-400" />
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-2 bg-white">
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-colors text-sm"
              >
                요약 제출하고 관전 모드로 가기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

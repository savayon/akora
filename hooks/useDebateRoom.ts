import { useState, useEffect, useRef, useCallback } from 'react';
import { Turn, Debate, SelectionPopup } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { turnRepository, debateRepository, debateCommentRepository } from '@/repositories';
import type { Comment } from '@/types';

/**
 * 토론방 핵심 로직 Hook.
 * debateId를 받아서 DB에서 토론 메타 + 턴 데이터를 로드합니다.
 */
export const useDebateRoom = (debateId?: string) => {
  const { currentUser } = useAppStore();
  
  const [debateMeta, setDebateMeta] = useState<Debate | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const [voteStats, setVoteStats] = useState({ proposer: 0, responder: 0, proposerPersuaded: 0, responderPersuaded: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [likedTurns, setLikedTurns] = useState<Record<string, boolean>>({});

  const [hasPreVoted, setHasPreVoted] = useState(false);
  const [hasFinalVoted, setHasFinalVoted] = useState(false);
  const [showPreVoteModal, setShowPreVoteModal] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (!debateId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [debate, turnData, commentsData, stats, userPreVote, userFinalVote] = await Promise.all([
          debateRepository.getDebate(debateId),
          turnRepository.getTurns(debateId),
          debateCommentRepository.getComments(debateId),
          debateRepository.getVoteStats(debateId),
          currentUser?.id ? debateRepository.getUserVote(debateId, currentUser.id, 'pre') : Promise.resolve(null),
          currentUser?.id ? debateRepository.getUserVote(debateId, currentUser.id, 'final') : Promise.resolve(null),
        ]);
        setDebateMeta(debate);
        setTurns(turnData);
        setLiveComments(commentsData);
        setVoteStats(stats);
        
        if (userPreVote) setHasPreVoted(true);
        if (userFinalVote) setHasFinalVoted(true);

        const isViewer = debate && currentUser?.name !== debate.proposerName && currentUser?.name !== debate.responderName;
        // 사전 투표 모달 로직: 관전자이고 아직 사전 투표를 안했다면 띄움 (단, preparing 상태에서는 안 띄움)
        if (isViewer && !userPreVote && currentUser?.id && debate?.status !== 'preparing') {
          setShowPreVoteModal(true);
        }
        
        if (turnData.length > 0) {
          const lastTurn = turnData[turnData.length - 1];
          setCurrentTurnOwner(lastTurn.authorRole === 'proposer' ? 'responder' : 'proposer');
        } else {
          setCurrentTurnOwner('responder');
        }
      } catch (e: any) {
        console.error('Fetch Debate Data Error:', e);
        alert('토론 데이터를 불러오는데 실패했습니다: ' + e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [debateId, currentUser?.id]);

  const role: 'proposer' | 'responder' | 'viewer' = 
    debateMeta && currentUser.name === debateMeta.proposerName ? 'proposer' 
    : debateMeta && currentUser.name === debateMeta.responderName ? 'responder' 
    : 'viewer';
              
  const [isDebateEnded, setIsDebateEnded] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const isFullView = role === 'viewer' || isDebateEnded;
  
  const [currentTurnOwner, setCurrentTurnOwner] = useState<'proposer' | 'responder'>('responder');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 인용 응답 대상 상태
  const [replyTarget, setReplyTarget] = useState<{
    quotedTurnId: string | number;
    quotedTurnNum: number;
    quotedExcerpt: string;
    quotedAuthorName: string;
  } | null>(null);

  // 채팅 스크롤 하단 레퍼런스
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 드래그 부분 인용 팝업 상태
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopup>(null);

  const [chatPage, setChatPage] = useState(0);
  const itemsPerPage = 3;
  const totalChatPages = Math.ceil(turns.length / itemsPerPage);

  useEffect(() => {
    if (!isDebateEnded || role !== 'viewer') {
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [turns, isDebateEnded, role]);

  // 마우스 드래그 이벤트 (텍스트 부분 인용) 핸들러
  const handleMouseUp = useCallback(() => {
    const canReply = !isDebateEnded && role === currentTurnOwner;
    if (!canReply) {
      setSelectionPopup(null);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionPopup(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2) {
      setSelectionPopup(null);
      return;
    }

    let node = selection.anchorNode?.parentElement;
    let turnElement: HTMLElement | null = null;
    
    while (node && node !== document.body) {
      if (node.hasAttribute('data-turn-id')) {
        turnElement = node;
        break;
      }
      node = node.parentElement;
    }

    if (turnElement) {
      const turnId = turnElement.getAttribute('data-turn-id') || '';
      const turnNum = Number(turnElement.getAttribute('data-turn-num'));
      const authorName = turnElement.getAttribute('data-author-name') || '';

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionPopup({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        text: selectedText,
        turnId,
        turnNum,
        authorName
      });
    } else {
      setSelectionPopup(null);
    }
  }, [isDebateEnded, role, currentTurnOwner]);

  useEffect(() => {
    const handleScroll = () => setSelectionPopup(null);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePartialQuote = useCallback(() => {
    if (selectionPopup) {
      setReplyTarget({
        quotedTurnId: selectionPopup.turnId,
        quotedTurnNum: selectionPopup.turnNum,
        quotedAuthorName: selectionPopup.authorName,
        quotedExcerpt: selectionPopup.text
      });
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    }
  }, [selectionPopup]);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || !debateMeta || !debateId || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const turnNum = role === 'proposer' ? Math.ceil(turns.length / 2) + 1 : Math.ceil(turns.length / 2);
      const newTurn = await turnRepository.addTurn(debateId, {
        turnNum,
        authorRole: role as any,
        content: inputValue,
        quotedTurnId: replyTarget ? replyTarget.quotedTurnId : undefined,
        quotedExcerpt: replyTarget ? replyTarget.quotedExcerpt : undefined,
      });

      setTurns([...turns, newTurn]);
      setInputValue('');
      setReplyTarget(null);
      setSelectionPopup(null);
      setCurrentTurnOwner(role === 'proposer' ? 'responder' : 'proposer');
    } catch (e: any) {
      alert(e.message || '발언 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [inputValue, role, turns, replyTarget, debateMeta, debateId, isSubmitting]);

  const handleSubmitClaim = useCallback(async (claim: string) => {
    if (!debateId || !debateMeta || role === 'viewer' || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await debateRepository.submitClaim(debateId, role, claim);
      const updatedDebate = await debateRepository.getDebate(debateId);
      if (updatedDebate) {
        // AI 요약 도입 전 임시 로직: 둘 다 주장이 제출되면 즉시 in_progress 로 변경
        if (updatedDebate.proposerClaim && updatedDebate.responderClaim && updatedDebate.status === 'preparing') {
          await debateRepository.updateStatus(debateId, 'in_progress');
          updatedDebate.status = 'in_progress';
        }
        setDebateMeta(updatedDebate);
      }
    } catch (e: any) {
      alert(e.message || '주장 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [debateId, debateMeta, role, isSubmitting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleSubmit();
      }
    }
  }, [inputValue, handleSubmit]);

  const handleEndDebate = useCallback(() => {
    if (confirm('상대방에게 토론 종료를 제안하시겠습니까?\n(현재 데모 버전에서는 상대방 수락 없이 즉시 투표로 넘어갑니다.)')) {
      setIsDebateEnded(true);
      if (role !== 'viewer') {
        setShowSummaryModal(true);
      }
    }
  }, [role]);

  const handleScrollToTarget = useCallback((targetId: string | number) => {
    const el = document.getElementById(`turn-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-yellow-100', 'transition-colors', 'duration-500');
      setTimeout(() => {
        el.classList.remove('bg-yellow-100');
      }, 1500);
    }
  }, []);

  const handleVote = useCallback(async (stance: 'proposer' | 'responder', voteType: 'pre' | 'final') => {
    if (!debateId || !currentUser?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // 최종 투표 시 확인 모달 띄우기 (기존 요구사항 유지)
    if (voteType === 'final') {
      const confirmMessage = '투표하시겠습니까?';
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    try {
      await debateRepository.submitVote(debateId, currentUser.id, stance, voteType);
      
      if (voteType === 'pre') {
        setHasPreVoted(true);
        setShowPreVoteModal(false);
      } else {
        setHasFinalVoted(true);
      }
      
      // 최신 stats 다시 로드
      const newStats = await debateRepository.getVoteStats(debateId);
      setVoteStats(newStats);

      if (voteType === 'final') {
        alert('최종 판결이 반영되었습니다! 설득 지표를 확인해보세요.');
      }
    } catch (e: any) {
      alert(e.message || '투표 실패');
    }
  }, [debateId, currentUser, debateMeta]);

  const handleLikeTurn = (turnId: string) => {
    setLikedTurns(prev => ({
      ...prev,
      [turnId]: !prev[turnId]
    }));
  };

  return {
    debateMeta,
    isLoading,
    role,
    isDebateEnded, setIsDebateEnded,
    hasPreVoted, setHasPreVoted,
    hasFinalVoted, setHasFinalVoted,
    showPreVoteModal, setShowPreVoteModal,
    showSummaryModal, setShowSummaryModal,
    voteStats,
    isFullView,
    turns, setTurns,
    liveComments, setLiveComments,
    currentTurnOwner, setCurrentTurnOwner,
    inputValue, setInputValue,
    replyTarget, setReplyTarget,
    chatBottomRef,
    selectionPopup, setSelectionPopup,
    chatPage, setChatPage,
    itemsPerPage, totalChatPages,
    handleMouseUp,
    handlePartialQuote,
    handleSubmit,
    handleSubmitClaim,
    handleKeyDown,
    handleEndDebate,
    handleScrollToTarget,
    handleVote,
    handleLikeTurn,
    likedTurns
  };
};

import { useState, useEffect, useRef, useCallback } from 'react';
import { Turn, Debate, SelectionPopup } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { turnRepository, debateRepository, debateCommentRepository, judgmentRepository, preVoteRepository } from '@/repositories';
import { TurnService } from '@/services';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import type { Comment } from '@/types';

/**
 * 토론방 핵심 로직 Hook.
 * debateId를 받아서 DB에서 토론 메타 + 턴 데이터를 로드합니다.
 */
export const useDebateRoom = (debateId?: string) => {
  const { currentUser } = useAppStore();
  
  const [debateMeta, setDebateMeta] = useState<Debate | null>(null);
  const debateMetaRef = useRef<Debate | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const [voteStats, setVoteStats] = useState({ proposer: 0, responder: 0, proposerPersuaded: 0, responderPersuaded: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [likedTurns, setLikedTurns] = useState<Record<string, boolean>>({});

  const [hasPreVoted, setHasPreVoted] = useState(false);
  const [showPreVoteModal, setShowPreVoteModal] = useState(false);

  // 배심원(Judgment) 상태
  const [hasJudged, setHasJudged] = useState(false);
  
  interface JudgmentsData {
    judgments: import('@/types').Judgment[];
    currentCount: number;
    requiredCount: number;
  }
  
  const [judgmentsInfo, setJudgmentsInfo] = useState<JudgmentsData>({ judgments: [], currentCount: 0, requiredCount: 5 });

  // 데이터 로드
  useEffect(() => {
    if (!debateId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [debate, turnData, commentsData, userPreVote, judgmentsResult, userHasJudged] = await Promise.all([
          debateRepository.getDebate(debateId),
          turnRepository.getTurns(debateId),
          debateCommentRepository.getComments(debateId),
          currentUser?.id ? preVoteRepository.getUserPreVote(debateId, currentUser.id) : Promise.resolve(null),
          judgmentRepository.getJudgments(debateId),
          currentUser?.id ? judgmentRepository.hasUserJudged(debateId, currentUser.id) : Promise.resolve(false),
        ]);
        const generatedTopic = useAppStore.getState().generatedDebateTopics[debateId];
        const debateWithGeneratedTopic = (debate && generatedTopic
          ? { ...debate, topic: generatedTopic, topicStatus: 'completed' as const }
          : debate) as import('@/types').Debate | null;
        debateMetaRef.current = debateWithGeneratedTopic;
        setDebateMeta(debateWithGeneratedTopic);
        if (generatedTopic) useAppStore.getState().clearGeneratedDebateTopic(debateId);
        setTurns(turnData);
        setLiveComments(commentsData);
        
        if (userPreVote) setHasPreVoted(true);
        
        setJudgmentsInfo(judgmentsResult);
        setHasJudged(userHasJudged);

        const isViewer = debate && currentUser?.id !== debate.proposerId && currentUser?.id !== debate.responderId;
        // 사전 투표 모달 로직: 관전자(비회원 포함)이고 아직 사전 투표를 안했다면 띄움 (단, preparing 상태에서는 안 띄움)
        if (isViewer && !userPreVote && debate?.status !== 'preparing') {
          setShowPreVoteModal(true);
        } else {
          setShowPreVoteModal(false);
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

  useEffect(() => {
    if (!debateId) return;

    return useAppStore.subscribe((state, previousState) => {
      const generatedTopic = state.generatedDebateTopics[debateId];
      if (!generatedTopic || generatedTopic === previousState.generatedDebateTopics[debateId] || !debateMetaRef.current) return;

      const updatedDebate = {
        ...debateMetaRef.current,
        topic: generatedTopic,
        topicStatus: 'completed' as const,
      };
      debateMetaRef.current = updatedDebate;
      setDebateMeta(updatedDebate);
      state.clearGeneratedDebateTopic(debateId);
    });
  }, [debateId]);

  useEffect(() => {
    if (!debateId) return;

    const supabase = createSupabaseClient();
    const channel = supabase
      .channel(`debate-topic-${debateId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'debates', filter: `id=eq.${debateId}` },
        (payload) => {
          console.info(`[Debate ${debateId}] Realtime UPDATE`, payload.new);
          const updated = payload.new as { topic?: string | null; topic_status?: Debate['topicStatus']; status?: Debate['status'] };
          setDebateMeta((previous) => previous ? {
            ...previous,
            topic: updated.topic?.trim() || '토론 주제 정의중...',
            topicStatus: updated.topic_status || previous.topicStatus,
            status: updated.status || previous.status,
          } : previous);
        },
      )
      .subscribe((status) => console.info(`[Debate ${debateId}] Realtime subscription`, status));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debateId]);

  const role: 'proposer' | 'responder' | 'viewer' =
    debateMeta && currentUser.id === debateMeta.proposerId ? 'proposer'
    : debateMeta && currentUser.id === debateMeta.responderId ? 'responder'
    : 'viewer';
              
  const isDebateEnded = debateMeta?.status === 'judging' || debateMeta?.status === 'completed';
  
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

  const refreshDebateMeta = useCallback(async () => {
    if (!debateId) return;
    const debate = await debateRepository.getDebate(debateId);
    if (debate) setDebateMeta(debate);
  }, [debateId]);

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
      const newTurn = await TurnService.addTurn(debateId, {
        turnNum,
        authorRole: role as any,
        content: inputValue,
        quotedTurnId: replyTarget ? replyTarget.quotedTurnId : undefined,
        quotedExcerpt: replyTarget ? replyTarget.quotedExcerpt : undefined,
      }, {
        id: currentUser.id,
        name: currentUser.name,
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

  const handleEndDebate = useCallback(async () => {
    if (confirm('토론을 정말로 종료하시겠습니까?\n(종료 시 더 이상 발언할 수 없으며 즉시 투표로 넘어갑니다.)')) {
      if (debateId) {
        await debateRepository.endDebate(debateId);
        await refreshDebateMeta();
      }
    }
  }, [role, debateId, refreshDebateMeta]);

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
    isDebateEnded,
    hasPreVoted, setHasPreVoted,
    showPreVoteModal, setShowPreVoteModal,
    isFullView,
    turns, setTurns,
    liveComments, setLiveComments,
    currentTurnOwner, setCurrentTurnOwner,
    inputValue, setInputValue,
    refreshDebateMeta,
    replyTarget, setReplyTarget,
    chatBottomRef,
    selectionPopup, setSelectionPopup,
    chatPage, setChatPage,
    itemsPerPage, totalChatPages,
    hasJudged,
    judgmentsData: judgmentsInfo,
    likedTurns,
    handleMouseUp,
    handlePartialQuote,
    handleSubmit,
    handleSubmitClaim,
    handleKeyDown,
    handleEndDebate,
    handleScrollToTarget,
    handleLikeTurn,
    refreshJudgments: async () => {
      if (!debateId) return;
      const res = await judgmentRepository.getJudgments(debateId);
      setJudgmentsInfo(res);
      if (currentUser?.id) {
        setHasJudged(await judgmentRepository.hasUserJudged(debateId, currentUser.id));
      }
    },
    endDebate: async () => {
      if (debateId) {
        await debateRepository.endDebate(debateId);
        await refreshDebateMeta();
      }
    }
  };
};

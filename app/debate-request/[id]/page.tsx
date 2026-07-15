"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCountdown } from '@/hooks/useCountdown';
import { proposalRepository, debateRepository, notificationRepository } from '@/repositories';
import type { Proposal } from '@/types';

// Mock Data
const requestMeta = {
  id: 1,
  proposerName: '테크선구자',
  targetComment: '과도한 규제는 혁신을 막을 뿐입니다. 안전장치는 기술 발전과 병행하여 만들어가야지, 무작정 멈추는 것은 글로벌 경쟁에서 도태되는 길입니다.',
  proposalReason: '귀하가 작성하신 "안전장치는 기술 발전과 병행해야 한다"는 의견에 일부 동의하나, 통제 불가능한 특이점이 오기 전 선제적 규제의 중요성을 간과하고 계신 것 같아 이에 대해 논의해보고 싶습니다.',
  proposedTopic: 'AI 기술 발전, 잠시 멈춰야 하는가?',
  firstArgument: '최근 AI 기술의 발전 속도가 너무 빠릅니다. 인간의 통제가 미치지 못하는 영역이 생겨날 수 있다는 경고가 계속 나오고 있습니다. 안전에 대한 확실한 가이드라인과 글로벌 규제가 마련될 때까지는 대규모 AI 모델의 학습과 배포를 최소 6개월 이상 중단해야 한다고 생각합니다.',
  expiresIn: '23시간 45분',
};

export default function DebateRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [isRejecting, setIsRejecting] = useState(false);
  const [responderClaim, setResponderClaim] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const { timeLeft: expiresIn } = useCountdown(proposal?.createdAt || '', 24 * 60 * 60 * 1000);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const data = await proposalRepository.getProposal(resolvedParams.id);
        if (data) {
          if (data.status === 'accepted') {
            const debateData = await debateRepository.getDebateByProposalId(data.id);
            if (debateData) {
              router.replace(`/debate/live/${debateData.id}`);
              return;
            }
          }
          setProposal(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (error) {
      alert("유효하지 않은 접근이거나 이미 처리된 제안입니다.");
      router.replace('/board/free');
    }
  }, [error, router]);

  if (loading || !proposal) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">데이터를 불러오는 중...</div>;
  }

  const handleAccept = async () => {
    if (!proposal || isProcessing) return;
    setIsProcessing(true);
    try {
      // 1. 토론 제안 상태 업데이트
      await proposalRepository.updateStatus(String(proposal.id), 'accepted');
      
      // 2. 새로운 토론방 생성
      const createdDebate = await debateRepository.createDebate({
        id: proposal.id, // Proposal ID를 전달하여 proposal_id 에 넣음
        topic: proposal.topic,
        proposerId: proposal.proposerId || '',
        responderId: proposal.targetId || '',
        proposerName: proposal.proposerName,
        responderName: proposal.targetName,
        originType: proposal.sourceType,
        originPreview: proposal.excerpt,
        originUrl: proposal.sourceType === 'post' ? `/board/free/${proposal.sourceId}` : `/board/free`,
        proposerClaim: proposal.claim,
        responderClaim: responderClaim,
        status: 'in_progress',
      });

      // 3. 알림 생성 (상대방에게 수락되었음을 알림)
      if (proposal.proposerId) {
        await notificationRepository.createNotification(proposal.proposerId, {
          type: 'debate_ended', // (임시) 알림 아이콘/타입 재사용
          icon: '🤝',
          message: `${proposal.targetName}님이 토론 제안을 수락했습니다!`,
          subtext: `주제: "${proposal.topic}"`,
          link: `/debate/live/${createdDebate.id}`
        });
      }

      // 4. 보고싶어요(proposal_watches) 했던 유저들을 팔로워(debate_followers)로 마이그레이션하고 알림 발송
      try {
        const watcherIds = await proposalRepository.migrateWatchersToFollowers(proposal.id, String(createdDebate.id));
        
        for (const watcherId of watcherIds) {
          // 본인이 아니라면 알림
          if (watcherId !== proposal.proposerId && watcherId !== proposal.targetId) {
            await notificationRepository.createNotification(watcherId, {
              type: 'proposal_received',
              icon: '👀',
              message: `보고싶어했던 토론이 성사되었습니다!`,
              subtext: `주제: "${proposal.topic}"`,
              link: `/debate/live/${createdDebate.id}`
            });
          }
        }
      } catch (err) {
        console.error('Failed to migrate watchers:', err);
      }

      // 5. 새 토론방으로 이동
      router.push(`/debate/live/${createdDebate.id}`);
    } catch (e: any) {
      console.error(e);
      // 이미 토론방이 생성되어 있는 경우 (unique constraint error)
      if (e.message && e.message.includes('duplicate key value violates unique constraint')) {
        const debateData = await debateRepository.getDebateByProposalId(proposal.id);
        if (debateData) {
          alert('이미 수락되어 생성된 토론방이 있습니다. 토론방으로 이동합니다.');
          router.push(`/debate/live/${debateData.id}`);
          return;
        }
      }
      alert('토론 수락 중 오류가 발생했습니다: ' + e.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* 상단 타이틀 영역 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-3xl mb-4 shadow-sm border border-purple-200">
            ✉️
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">누군가 당신의 논리에 도전했습니다</h1>
          <p className="text-slate-500 font-medium">당신의 댓글을 읽고 정식 토론을 제안한 사용자가 있습니다. 공개된 아고라에서 논리로 증명해 보시겠습니까?</p>
        </div>

        {/* 상세 내용 카드 */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden relative">
          {/* 장식용 탑 바 */}
          <div className="h-2 bg-gradient-to-r from-orange-400 via-purple-500 to-blue-500"></div>

          <div className="p-6 md:p-10 space-y-10">
            
            {/* 1. 제안자 정보 */}
            <div className="flex flex-col items-center border-b border-slate-100 pb-8">
              <span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-3">제안자</span>
              <div className="text-xl font-black text-slate-800">{proposal.proposerName}</div>
            </div>

            {/* 2. 대상이 된 나의 댓글/글 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                  {proposal.sourceType === 'post' ? '대상이 된 회원님의 글' : '대상이 된 회원님의 댓글'}
                </h3>
              </div>
              <Link 
                href={`/board/free/${proposal.postId}`}
                className="block bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-lg text-slate-700 leading-relaxed hover:bg-slate-100 transition-colors"
              >
                "{proposal.excerpt}"
              </Link>
            </div>

            {/* 3. 상대방 댓글 (제안된 토론 내용) */}
            <div>
              <h3 className="text-sm font-black text-slate-400 mb-3 flex items-center gap-1.5">
                상대방 댓글
              </h3>
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="text-xs font-black text-slate-500 mb-2">
                  {proposal.proposerName}님의 첫 번째 주장
                </h3>
                <p className="text-slate-800 text-[15px] leading-relaxed font-medium">
                  "{proposal.claim}"
                </p>
              </div>
            </div>

            {/* 5. 규칙 및 액션 영역 */}
            <div className="pt-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">수락하는 순간 이 논쟁은 <span className="text-blue-600">공개 토론 콘텐츠</span>로 전환됩니다.</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">상대의 첫 번째 주장을 완벽하게 반박해 보세요.</p>
                  </div>
                </div>
                <div className="text-xs font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shrink-0">
                  수락 기한: {expiresIn}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-2">나의 주장 입력 (필수)</h4>
                <input 
                  type="text"
                  maxLength={20}
                  value={responderClaim}
                  onChange={(e) => setResponderClaim(e.target.value)}
                  placeholder="토론 수락 시 사용할 나의 주장을 20자 이내로 적어주세요."
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-800 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 mb-2 shadow-inner"
                />
              </div>

              {!isRejecting ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setIsRejecting(true)}
                    className="flex-1 py-4 px-6 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    거절
                  </button>
                  <button 
                    onClick={() => {
                      const claim = responderClaim.trim();
                      if (!claim || claim.length < 5) {
                        alert('나의 주장을 최소 5자 이상 20자 이내로 입력해야 수락할 수 있습니다.');
                        return;
                      }
                      if (window.confirm('이 토론을 수락하시겠습니까? 수락 시 공개 토론방이 즉시 생성됩니다.')) {
                        handleAccept();
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-[2] py-4 px-6 rounded-xl font-black text-white bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 hover:border-slate-800 shadow-md transition-all group flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? '처리 중...' : '토론 수락'}
                    {!isProcessing && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                  </button>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">거절 사유 (선택사항)</h4>
                  <textarea 
                    placeholder="상대방에게 전달할 정중한 거절 사유를 입력해 주세요."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm min-h-[80px] outline-none focus:border-purple-400 mb-3"
                  ></textarea>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsRejecting(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-sm transition-colors"
                    >
                      취소
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('정말 이 토론 제안을 거절하시겠습니까?')) {
                          router.push('/');
                        }
                      }}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm transition-colors"
                    >
                      거절 전송
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

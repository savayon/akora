import { debateRepository, preVoteRepository, judgmentRepository } from '@/repositories';
import { HotScorePolicy } from '@/policies/HotScorePolicy';
import { PersuasionPolicy } from '@/policies/PersuasionPolicy';
import type { Debate, Judgment } from '@/types';

export interface DebateSummaryDto {
  debate: Debate;
  isHot: boolean;
  isTense: boolean;
  persuasionCount: { proposer: number; responder: number };
  isProposerPersuasionKing: boolean;
  isResponderPersuasionKing: boolean;
  judgmentProgress: { proposer: number; responder: number; total: number; required: number };
}

export class DebateService {
  /**
   * 단일 토론의 상세 정보와 뱃지/통계 정보를 통합해서 반환합니다.
   */
  static async getDebateSummary(debateId: string, supabaseClient?: any): Promise<DebateSummaryDto | null> {
    // 1. 핵심 데이터 4가지를 한 번에 병렬로 가져옵니다 (단방향 병목 제거)
    const [debate, preVoteStats, { judgments, currentCount, requiredCount }, preVotesMap] = await Promise.all([
      debateRepository.getDebate(debateId, supabaseClient),
      preVoteRepository.getPreVoteStats(debateId, supabaseClient),
      judgmentRepository.getJudgments(debateId, supabaseClient),
      preVoteRepository.getAllPreVotesMap(debateId, supabaseClient)
    ]);

    if (!debate) return null;

    // 2. 핫 / 팽팽함 판별 로직
    const isHot = HotScorePolicy.isHot(preVoteStats.total);
    const isTense = HotScorePolicy.isTense(preVoteStats.proposer, preVoteStats.responder);

    let proposerPersuaded = 0;
    let responderPersuaded = 0;
    let proposerJudgments = 0;
    let responderJudgments = 0;

    // 3. 설득 연산 (N+1 문제 해결됨: preVotesMap에서 O(1) 메모리 조회)
    for (const judgment of judgments) {
      if (!judgment.jurorId) continue; // AI 판정 등 예외처리
      
      const votedStance = judgment.votedForId === debate.proposerId ? 'proposer' : 'responder';
      if (votedStance === 'proposer') proposerJudgments++;
      if (votedStance === 'responder') responderJudgments++;

      const preStance = preVotesMap.get(judgment.jurorId) || null;

      // 제안자가 설득했는가?
      if (PersuasionPolicy.isPersuaded(preStance, votedStance, 'proposer')) {
        proposerPersuaded++;
      }
      
      // 답변자가 설득했는가?
      if (PersuasionPolicy.isPersuaded(preStance, votedStance, 'responder')) {
        responderPersuaded++;
      }
    }

    const isProposerPersuasionKing = PersuasionPolicy.isPersuasionKing(proposerPersuaded);
    const isResponderPersuasionKing = PersuasionPolicy.isPersuasionKing(responderPersuaded);

    return {
      debate,
      isHot,
      isTense,
      persuasionCount: { proposer: proposerPersuaded, responder: responderPersuaded },
      isProposerPersuasionKing,
      isResponderPersuasionKing,
      judgmentProgress: {
        proposer: proposerJudgments,
        responder: responderJudgments,
        total: currentCount,
        required: requiredCount
      }
    };
  }

  /**
   * 리스트뷰용 가벼운 요약 (불필요한 설득왕/판정 통계를 생략하고 쿼리를 최적화합니다.)
   */
  static async getLightweightDebateSummary(debate: Debate, supabaseClient?: any): Promise<DebateSummaryDto> {
    const preVoteStats = await preVoteRepository.getPreVoteStats(debate.id.toString(), supabaseClient);
    
    return {
      debate,
      isHot: HotScorePolicy.isHot(preVoteStats.total),
      isTense: HotScorePolicy.isTense(preVoteStats.proposer, preVoteStats.responder),
      persuasionCount: { proposer: 0, responder: 0 },
      isProposerPersuasionKing: false,
      isResponderPersuasionKing: false,
      judgmentProgress: { proposer: 0, responder: 0, total: 0, required: 0 }
    };
  }

  /**
   * 활성화된 토론 목록을 요약 형태로 가져옵니다. (리스트뷰용)
   * 현재 MVP 구조상 N+1 쿼리가 발생하므로, 추후 최적화 대상입니다.
   */
  static async getActiveDebateSummaries(supabaseClient?: any): Promise<DebateSummaryDto[]> {
    const debates = await debateRepository.getActiveDebates(supabaseClient);
    // 10개 미만의 가벼운 통계 조회이므로 Promise.all로 병렬 처리해도 무방합니다.
    const summaries = await Promise.all(
      debates.map(debate => this.getLightweightDebateSummary(debate, supabaseClient))
    );
    return summaries;
  }

  /**
   * 최근 토론 목록을 요약 형태로 가져옵니다. (홈화면용)
   */
  static async getRecentDebateSummaries(limit: number, supabaseClient?: any): Promise<DebateSummaryDto[]> {
    const debates = await debateRepository.getRecentDebates(limit, supabaseClient);
    const summaries = await Promise.all(
      debates.map(debate => this.getLightweightDebateSummary(debate, supabaseClient))
    );
    return summaries;
  }
}

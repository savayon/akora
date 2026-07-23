import { judgmentRepository, debateRepository } from '@/repositories';
import { Judgment } from '@/types';

export class JudgmentService {
  /**
   * 판정(Judgment)을 제출하고, 만약 필요한 배심원 수에 도달했다면
   * 승자 계산 로직을 거쳐 토론을 완료 상태(completed)로 전환합니다.
   */
  static async submitAndCheckCompletion(
    debateId: string,
    jurorId: string | null,
    jurorType: 'human' | 'ai' | 'expert',
    votedForId: string,
    reason: string
  ): Promise<{ success: boolean; isCompleted: boolean }> {
    try {
      // 1. 판정 제출
      const submitResult = await judgmentRepository.submitJudgment(
        debateId,
        jurorId,
        jurorType,
        votedForId,
        reason
      );

      if (!submitResult) return { success: false, isCompleted: false };

      // 2. 현재 상태 확인 (필요 배심원 달성 여부)
      const { judgments, currentCount, requiredCount } = await judgmentRepository.getJudgments(debateId);
      
      if (currentCount >= requiredCount) {
        // 3. 승자 도출 로직 실행 (다수결 등)
        const winnerId = this.calculateWinner(judgments);
        
        // 4. 토론 종료 처리
        if (winnerId) {
          const closeSuccess = await debateRepository.closeDebateWithResult(debateId, winnerId);
          if (closeSuccess) {
            return { success: true, isCompleted: true };
          }
        }
      }

      return { success: true, isCompleted: false };
    } catch (error) {
      console.error('submitAndCheckCompletion error:', error);
      throw error;
    }
  }

  /**
   * 승자 도출 도메인 로직.
   * 향후 AI 배심원 가중치, 전문가 가중치 등을 이곳에 추가하여 확장할 수 있습니다.
   */
  static calculateWinner(judgments: Judgment[]): string | null {
    if (!judgments || judgments.length === 0) return null;

    const voteCounts: Record<string, number> = {};

    judgments.forEach(j => {
      // 현재는 1인 1표. 향후 j.jurorType === 'expert' 일 때 가중치를 주는 등 변경 가능.
      const weight = 1; 
      
      if (!voteCounts[j.votedForId]) {
        voteCounts[j.votedForId] = 0;
      }
      voteCounts[j.votedForId] += weight;
    });

    // 최다 득표자 찾기
    let maxVotes = -1;
    let winnerId: string | null = null;
    let isTie = false;

    for (const [votedId, votes] of Object.entries(voteCounts)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winnerId = votedId;
        isTie = false;
      } else if (votes === maxVotes) {
        isTie = true;
      }
    }

    // 동률일 경우 우선 null 반환 (실제로는 무승부 처리 정책이 필요하지만 현재는 단수 최다득표자 우선)
    if (isTie) {
      return null; // fallback or tie handling policy
    }

    return winnerId;
  }
}

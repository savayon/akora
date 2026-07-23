import type { Judgment } from '@/types';

/**
 * PersuasionPolicy
 * 
 * 특정 배심원의 판정이 '설득'에 해당하는지,
 * 그리고 최종적으로 방장이 '설득왕' 뱃지를 얻을 수 있는지를 판단하는 도메인 정책 클래스.
 */
export class PersuasionPolicy {
  // 설득왕 기준: 5명 이상을 설득해야 뱃지 획득
  private static readonly PERSUASION_KING_THRESHOLD = 5;

  /**
   * 해당 판정이 '설득'인지 판별합니다.
   * 설득의 기준: 사전투표에서는 '상대방' 또는 '중립(투표안함)' 이었으나, 최종 판정에서는 '나'를 선택한 경우.
   * 
   * @param preVoteStance 사전투표에서 선택한 입장 ('proposer' | 'responder' | null)
   * @param judgmentStance 최종 판정에서 선택한 입장 ('proposer' | 'responder')
   * @param targetRole 설득했는지 판별할 대상 (나의 역할) ('proposer' | 'responder')
   * @returns boolean 설득 성공 여부
   */
  static isPersuaded(
    preVoteStance: 'proposer' | 'responder' | null,
    judgmentStance: 'proposer' | 'responder',
    targetRole: 'proposer' | 'responder'
  ): boolean {
    // 1. 최종 판정이 내가 아니면 무조건 설득 아님
    if (judgmentStance !== targetRole) return false;

    // 2. 최종 판정이 나를 향했다면, 사전투표 때 나의 편이 아니었어야 함.
    // 즉, 사전투표를 안 했거나(null), 상대편을 찍었어야 설득임.
    if (preVoteStance !== targetRole) return true;

    return false;
  }

  /**
   * 설득왕 뱃지 획득 여부를 판별합니다.
   */
  static isPersuasionKing(persuadedCount: number): boolean {
    return persuadedCount >= this.PERSUASION_KING_THRESHOLD;
  }
}

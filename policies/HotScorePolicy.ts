/**
 * HotScorePolicy
 * 
 * 토론이 'HOT' 한지, 혹은 '팽팽함' 인지를 판단하는 도메인 정책 (Policy) 클래스입니다.
 * 오직 사전투표율(Pre-vote)과 인원수를 바탕으로 계산하며, 프론트엔드나 DB에 의존하지 않습니다.
 */

export class HotScorePolicy {
  // HOT 기준: 사전 투표자가 10명 이상일 때
  private static readonly HOT_THRESHOLD = 10;
  
  // 팽팽함 기준: 두 비율의 차이가 10% 이하일 때 (예: 45:55 ~ 55:45)
  private static readonly TENSE_MARGIN = 0.10;

  /**
   * 사전 투표 통계를 바탕으로 HOT 여부 반환
   */
  static isHot(totalVotes: number): boolean {
    return totalVotes >= this.HOT_THRESHOLD;
  }

  /**
   * 사전 투표 통계를 바탕으로 팽팽함 여부 반환
   */
  static isTense(proposerVotes: number, responderVotes: number): boolean {
    const total = proposerVotes + responderVotes;
    // 최소 인원 조건 (예: 5명 이상일 때만 팽팽함 체크)
    if (total < 5) return false;

    const proposerRatio = proposerVotes / total;
    const responderRatio = responderVotes / total;

    return Math.abs(proposerRatio - responderRatio) <= this.TENSE_MARGIN;
  }
}

import { matchRepo, debateRepository } from '@/repositories';
import { createClient } from '@/utils/supabase/client';

export class MatchService {
  /**
   * 1:1 랜덤 매칭을 요청합니다.
   * 1. 큐에 진입 (waiting)
   * 2. DB RPC를 호출하여 매칭 상대(waiting)를 찾고 동시에 둘 다 matching 상태로 락(Lock)
   * 3. 상대를 찾았다면 새로운 Debate를 생성
   * 4. 생성된 Debate ID로 두 유저의 큐 상태를 matched로 갱신
   */
  async requestMatch(userId: string, supabaseClient: any) {
    try {
      // 1. 큐 진입
      await matchRepo.enqueueUser(userId, supabaseClient);

      // 2. RPC 호출 (원자적 매칭 탐색)
      const opponentId = await matchRepo.matchUsers(userId, supabaseClient);

      if (opponentId) {
        // 매칭 성공! 이제 토론방을 생성해야 함
        
        // 2-1. 랜덤 주제 가져오기
        const topic = await matchRepo.getRandomTopic(supabaseClient);
        const topicTitle = topic ? topic.title : '자유 주제 토론';
        
        // 2-2. 토론방(Debate) 생성
        // 의존성 규칙에 따라 Debate 생성을 DebateRepository에 위임하는 것이 좋습니다.
        // 현재는 직접 insert 하고 있으나, 가급적이면 서버 환경의 supabaseClient를 사용해야 합니다.
        const { data: newDebate, error } = await supabaseClient
          .from('debates')
          .insert({
            proposer_id: userId,          // 요청한 사람을 Proposer로
            responder_id: opponentId,     // 매칭된 상대를 Responder로
            status: 'preparing',
            topic: topicTitle,
            current_turn: 1,
            // 기타 필수 필드 디폴트값 (테이블 정의에 따라 다름)
          })
          .select('id')
          .single();

        if (error || !newDebate) {
          console.error('Failed to create debate after match:', error);
          // 롤백: 토론방 생성 실패 시 둘 다 다시 failed 처리
          await matchRepo.updateMatchStatus(userId, 'failed', undefined, supabaseClient);
          await matchRepo.updateMatchStatus(opponentId, 'failed', undefined, supabaseClient);
          return { status: 'failed' };
        }

        // 2-3. 두 유저의 큐 상태를 matched로 업데이트하고 Debate ID 기록
        await matchRepo.updateMatchStatus(userId, 'matched', newDebate.id, supabaseClient);
        await matchRepo.updateMatchStatus(opponentId, 'matched', newDebate.id, supabaseClient);

        return { status: 'matched', debateId: newDebate.id };
      } else {
        // 상대를 찾지 못함 (대기 중)
        return { status: 'waiting' };
      }
    } catch (error) {
      console.error('requestMatch error:', error);
      await matchRepo.updateMatchStatus(userId, 'failed', undefined, supabaseClient);
      throw error;
    }
  }

  /**
   * 브라우저 종료 방어를 위한 하트비트 갱신
   */
  async pulseHeartbeat(userId: string, supabaseClient?: any) {
    await matchRepo.updateHeartbeat(userId, supabaseClient);
  }

  /**
   * 매칭 취소
   */
  async cancelMatch(userId: string, supabaseClient?: any) {
    await matchRepo.cancelMatch(userId, supabaseClient);
  }
}

export const matchService = new MatchService();

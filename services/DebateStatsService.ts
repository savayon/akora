import { debateRepository } from '@/repositories';

export interface DebateStats {
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  record: string;
  myPageRecord: string;
}

type Result = 'win' | 'draw' | 'loss' | null;

function formatRecord(wins: number, draws: number, losses: number) {
  const winRate = wins + losses === 0 ? 0 : (wins / (wins + losses)) * 100;

  return {
    winRate,
    record: `${wins}승 ${draws}무 ${losses}패 (${winRate.toFixed(1)}%)`,
    myPageRecord: `${wins}승 ${draws}무 ${losses}패 (${winRate.toFixed(1)}%)`,
  };
}

export const DebateStatsService = {
  async getUserDebateStats(userId: string, supabaseClient?: any): Promise<DebateStats> {
    const { debates, finalVotes } = await debateRepository.getDebateStatsData(userId, supabaseClient);
    const votesByDebate = new Map<string, { proposer: number; responder: number }>();

    for (const vote of finalVotes) {
      const voteCount = votesByDebate.get(vote.debate_id) || { proposer: 0, responder: 0 };
      voteCount[vote.stance] += 1;
      votesByDebate.set(vote.debate_id, voteCount);
    }

    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (const debate of debates) {
      const userRole = debate.proposer_id === userId ? 'proposer' : 'responder';
      const result = this.getDebateResult(debate, userRole, votesByDebate.get(debate.id));

      if (result === 'win') wins += 1;
      if (result === 'draw') draws += 1;
      if (result === 'loss') losses += 1;
    }

    return {
      wins,
      draws,
      losses,
      ...formatRecord(wins, draws, losses),
    };
  },

  getDebateResult(
    debate: {
      status: string;
      ended_reason: 'timeout' | 'normal' | 'abandoned' | 'forfeit' | null;
      timeout_loser_role: 'proposer' | 'responder' | 'both' | null;
    },
    userRole: 'proposer' | 'responder',
    finalVotes?: { proposer: number; responder: number },
  ): Result {
    if (debate.ended_reason === 'abandoned') return null;

    if (debate.ended_reason === 'timeout' || debate.ended_reason === 'forfeit') {
      if (!debate.timeout_loser_role || debate.timeout_loser_role === 'both') return null;
      return debate.timeout_loser_role === userRole ? 'loss' : 'win';
    }

    const isNormallyCompleted = debate.ended_reason === 'normal'
      || (debate.status === 'completed' && !debate.ended_reason);
    if (!isNormallyCompleted) return null;

    const votes = finalVotes || { proposer: 0, responder: 0 };
    if (votes.proposer === votes.responder) return 'draw';

    const winningRole = votes.proposer > votes.responder ? 'proposer' : 'responder';
    return winningRole === userRole ? 'win' : 'loss';
  },
};

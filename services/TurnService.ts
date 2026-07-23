import { turnRepository } from '@/repositories';
import type { Turn } from '@/types';
import { NotificationService } from './NotificationService';

export const TurnService = {
  async addTurn(
    debateId: string,
    turnData: Partial<Turn>,
    author: { id: string; name: string },
  ) {
    const newTurn = await turnRepository.addTurn(debateId, turnData);

    try {
      await NotificationService.notifyNewTurn({
        debateId,
        authorId: author.id,
        authorName: author.name,
      });
    } catch (error) {
      console.error('Turn notification failed:', error);
    }

    return newTurn;
  },
};

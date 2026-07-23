import { debateRepository, notificationRepository } from '@/repositories';
import type { NotificationType } from '@/types';

type NotificationInput = {
  type: NotificationType;
  icon: string;
  message: string;
  subtext?: string;
  link: string;
};

export const NotificationService = {
  async createNotification(recipientIds: Iterable<string>, notification: NotificationInput) {
    const uniqueRecipientIds = new Set([...recipientIds].filter(Boolean));

    await Promise.all([...uniqueRecipientIds].map(async (recipientId) => {
      try {
        await notificationRepository.createNotification(recipientId, notification);
      } catch (error) {
        console.error('Notification creation failed:', error);
      }
    }));
  },

  async notifyNewTurn({
    debateId,
    authorId,
    authorName,
  }: {
    debateId: string;
    authorId: string;
    authorName: string;
  }) {
    try {
      const recipients = await debateRepository.getDebateNotificationRecipients(debateId);
      await this.createNotification(
        recipients.filter((recipientId) => recipientId !== authorId),
        {
          type: 'turn_arrived',
          icon: '💬',
          message: `${authorName}님이 새 발언을 등록했습니다.`,
          link: `/debate/live/${debateId}`,
        },
      );
    } catch (error) {
      console.error('New turn notification failed:', error);
    }
  },

  async notifyDebateStarted({
    debateId,
    responderId,
    responderName,
    topic,
  }: {
    debateId: string;
    responderId: string;
    responderName: string;
    topic: string;
  }) {
    try {
      const recipients = await debateRepository.getDebateNotificationRecipients(debateId);
      await this.createNotification(
        recipients.filter((recipientId) => recipientId !== responderId),
        {
          type: 'debate_ended',
          icon: '🏁',
          message: `${responderName}님이 토론 제안을 수락했습니다!`,
          subtext: 'AI 토론 주제를 생성 중입니다.',
          link: `/debate/live/${debateId}`,
        },
      );
    } catch (error) {
      console.error('Debate start notification failed:', error);
    }
  },
};

import { createClient } from '@/utils/supabase/client';
import type { INotificationRepository } from '../interfaces';
import type { Notification } from '@/types';
import { formatRelativeTime } from '@/lib/formatTime';

export const SupabaseNotificationRepository: INotificationRepository = {
  async getUserNotifications(userId) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('알림 목록을 불러오지 못했습니다.', error.message);
      return [];
    }
    if (!data) return [];

    return data.map((row: any): Notification => ({
      id: row.id,
      type: row.type,
      icon: row.icon,
      message: row.message,
      subtext: row.subtext || undefined,
      link: row.link,
      isRead: row.is_read,
      createdAt: formatRelativeTime(row.created_at),
    }));
  },

  async markAsRead(notificationId) {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  },

  async markAllAsRead(userId) {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  async createNotification(userId, data) {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: data.type,
        icon: data.icon,
        message: data.message,
        subtext: data.subtext || null,
        link: data.link,
      });

    if (error) {
      console.error('Notification Insert Error:', error);
      {
        console.error(error);
        throw new Error('알림 생성 실패');
      }
    }

    return {
      id: Date.now(),
      type: data.type,
      icon: data.icon,
      message: data.message,
      subtext: data.subtext || undefined,
      link: data.link,
      isRead: false,
      createdAt: '방금 전',
    };
  },

  async deleteNotification(notificationId) {
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('id', notificationId);
  },
};

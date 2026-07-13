import { createClient } from '@/utils/supabase/client';
import type { IReportRepository } from '../interfaces';
import type { Report, ReportStatus } from '@/types';
import { formatRelativeTime } from '@/lib/formatTime';

export const SupabaseReportRepository: IReportRepository = {
  async createReport(input) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('reports')
      .insert({
        target_type: input.targetType,
        target_id: input.targetId,
        reporter_id: user.id,
        reason: input.reason,
        detail: input.detail || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error(error);
      throw new Error('신고 접수 실패');
    }

    return {
      id: data.id,
      targetType: data.target_type,
      targetId: data.target_id,
      reporterId: data.reporter_id,
      reason: data.reason,
      detail: data.detail || undefined,
      createdAt: data.created_at,
      status: data.status as ReportStatus,
    };
  },

  async getReports() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reports')
      .select('*, reporter:users!reports_reporter_fkey(nickname)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any): Report => ({
      id: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      reporterId: row.reporter?.nickname || row.reporter_id,
      reason: row.reason,
      detail: row.detail || undefined,
      createdAt: row.created_at,
      status: row.status,
    }));
  },

  async updateStatus(id, status) {
    const supabase = createClient();
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },

  async hideTarget(type, id) {
    const supabase = createClient();
    const table = type === 'post' ? 'posts' : 'comments';
    const { error } = await supabase.from(table).update({ is_hidden: true }).eq('id', id);
    if (error) {
      console.error(error);
      throw new Error('요청을 처리하는 중 오류가 발생했습니다.');
    }
  },
};

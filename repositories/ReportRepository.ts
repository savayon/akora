import type { Report, ReportStatus } from '@/types';

/**
 * ReportRepository
 * 향후 Supabase 교체를 대비하여 인터페이스를 추상화한 Mock 레포지토리입니다.
 */
let mockReports: Report[] = [];

export class ReportRepository {
  /**
   * 새로운 신고를 생성합니다.
   */
  static async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<Report> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newReport: Report = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    mockReports.push(newReport);
    return newReport;
  }

  /**
   * 모든 신고 내역을 가져옵니다.
   */
  static async getReports(): Promise<Report[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockReports;
  }

  /**
   * 신고 상태를 업데이트합니다.
   */
  static async updateReportStatus(id: string | number, status: ReportStatus): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const report = mockReports.find(r => r.id === id.toString() || r.id === id);
    if (report) {
      report.status = status;
    }
  }

  /**
   * 신고 대상(게시글/댓글)을 숨김 처리합니다.
   */
  static async hideTarget(type: 'post' | 'comment', id: string | number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock hiding is essentially a no-op since UI filters were removed in favor of DB queries.
  }
}

import { filterApprovedReportsForDistribution } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-689: [edge] レポート自動配信機能 - 未承認のレポートは配信対象から除外される
  test('未承認のレポートは配信対象から除外され、承認済みレポートのみが配信対象として抽出される', () => {
    const approved_report = {
      report_id: 'RPT-001',
      report_title: '2024年1月営業成果レポート',
      customer_id: 'CUST-A001',
      approval_status: 'approved',
      approved_at: '2024-01-31T14:30:00Z',
      created_at: '2024-01-31T09:00:00Z',
    };

    const unapproved_report_1 = {
      report_id: 'RPT-002',
      report_title: '2024年1月営業成果レポート（修正版）',
      customer_id: 'CUST-B001',
      approval_status: 'pending',
      approved_at: null,
      created_at: '2024-01-31T10:15:00Z',
    };

    const unapproved_report_2 = {
      report_id: 'RPT-003',
      report_title: '2024年1月営業成果レポート（確認中）',
      customer_id: 'CUST-C001',
      approval_status: 'rejected',
      approved_at: null,
      created_at: '2024-01-31T11:45:00Z',
    };

    const all_reports = [
      approved_report,
      unapproved_report_1,
      unapproved_report_2,
    ];

    const distribution_list = filterApprovedReportsForDistribution(all_reports);

    expect(distribution_list).toHaveLength(1);

    expect(distribution_list[0]).toEqual({
      report_id: 'RPT-001',
      report_title: '2024年1月営業成果レポート',
      customer_id: 'CUST-A001',
      approval_status: 'approved',
      approved_at: '2024-01-31T14:30:00Z',
      created_at: '2024-01-31T09:00:00Z',
    });

    const report_ids_in_distribution = distribution_list.map((r) => r.report_id);
    expect(report_ids_in_distribution).toContain('RPT-001');
    expect(report_ids_in_distribution).not.toContain('RPT-002');
    expect(report_ids_in_distribution).not.toContain('RPT-003');

    const unapproved_ids = all_reports
      .filter((r) => r.approval_status !== 'approved')
      .map((r) => r.report_id);
    for (const unapproved_id of unapproved_ids) {
      expect(report_ids_in_distribution).not.toContain(unapproved_id);
    }

    const all_in_distribution_are_approved = distribution_list.every(
      (r) => r.approval_status === 'approved',
    );
    expect(all_in_distribution_are_approved).toBe(true);
  });
});
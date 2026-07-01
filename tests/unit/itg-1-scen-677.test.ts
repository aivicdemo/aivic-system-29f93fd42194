import { generateAndDistributeReport } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-677: [error] レポート自動配信機能 - 未承認のレポートは配信されない
  test('未承認のレポートは自動配信されず、配信ログに承認されていないエラーメッセージが記録される', () => {
    const unapprovedReportInput = {
      reportId: 'RPT-20240115-001',
      reportName: '2024年1月営業成果レポート',
      customerId: 'CUST-12345',
      serviceName: 'アポイント代行',
      approvalStatus: 'unapproved',
      appointmentCount: 45,
      contractCount: 12,
      servicePrice: 5000,
      discountRate: 0.1,
      deliveryDate: new Date('2024-01-25T09:00:00Z'),
      recipientEmail: 'sales@customer-example.com',
      reportContent: {
        period: '2024-01',
        totalAppointments: 45,
        totalContracts: 12,
        conversionRate: 0.267,
      },
    };

    const result = generateAndDistributeReport(unapprovedReportInput);

    expect(result.distributionStatus).toBe('skipped');
    expect(result.distributionLog).toContain('承認されていないレポート');
    expect(result.distributionLog).not.toContain('配信完了');
    expect(result.emailDelivered).toBe(false);
    expect(result.recipientCount).toBe(0);
    expect(result.billingAmount).toBe(0);
  });
});
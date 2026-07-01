import { generateBillingAndReportWithTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-600
  test('[error] 請求書・成果レポートの自動生成 - テンプレートが未定義の場合、生成処理がエラーで失敗する', () => {
    const salesData = {
      contractId: 'CT-2024-001',
      customerId: 'CUS-A001',
      serviceType: 'appointment_management',
      appointmentCount: 5,
      closedDealCount: 2,
      customerReaction: 'positive',
      month: '2024-01',
      reportGenerationDate: new Date('2024-02-01T09:00:00Z'),
    };

    const undefinedTemplate = undefined;

    expect(() =>
      generateBillingAndReportWithTemplate(salesData, undefinedTemplate)
    ).toThrow(/テンプレート/);
  });
});
import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateAndDistributeMonthlyReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次レポート生成・配信期限管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SCEN-1146: レポート生成から配信完了が定められた期限内に完了する', () => {
    // テストデータ準備
    const salesDataList = [
      {
        customerId: 'CUST001',
        appointmentCount: 5,
        contractCount: 2,
        customerFeedback: 'positive',
        serviceName: 'ServiceA',
        reportMonth: '2024-01',
      },
      {
        customerId: 'CUST002',
        appointmentCount: 3,
        contractCount: 1,
        customerFeedback: 'neutral',
        serviceName: 'ServiceB',
        reportMonth: '2024-01',
      },
    ];

    const monthlyReportConfig = {
      templateId: 'TPL001',
      generationDeadlineMinutes: 30,
      distributionDeadlineMinutes: 60,
      deliveryFormat: 'email',
      recipientList: [
        { customerId: 'CUST001', email: 'contact@cust001.com' },
        { customerId: 'CUST002', email: 'contact@cust002.com' },
      ],
    };

    const startTime = new Date('2024-01-31T09:00:00Z');
    const generationCompleteTime = new Date('2024-01-31T09:20:00Z');
    const distributionCompleteTime = new Date('2024-01-31T09:55:00Z');

    // レポート生成・配信期限管理機能を実行
    const result = generateAndDistributeMonthlyReport({
      salesData: salesDataList,
      config: monthlyReportConfig,
      startTimestamp: startTime.getTime(),
      generationCompleteTimestamp: generationCompleteTime.getTime(),
      distributionCompleteTimestamp: distributionCompleteTime.getTime(),
    });

    // 期限内完了の確認
    const generationElapsedMinutes = (generationCompleteTime.getTime() - startTime.getTime()) / (1000 * 60);
    const totalElapsedMinutes = (distributionCompleteTime.getTime() - startTime.getTime()) / (1000 * 60);

    expect(generationElapsedMinutes).toBeLessThanOrEqual(monthlyReportConfig.generationDeadlineMinutes);
    expect(totalElapsedMinutes).toBeLessThanOrEqual(monthlyReportConfig.distributionDeadlineMinutes);

    // レポート生成成功の確認
    expect(result.generationStatus).toBe('completed');
    expect(result.generationCompletedAt).toBe(generationCompleteTime.toISOString());

    // 配信完了ステータスの記録確認
    expect(result.distributionStatus).toBe('completed');
    expect(result.distributionCompletedAt).toBe(distributionCompleteTime.toISOString());
    expect(result.totalProcessingTimeMinutes).toBe(55);

    // 配信対象顧客数の確認
    expect(result.recipientsCount).toBe(2);

    // 各顧客へのレポート生成確認
    expect(result.reportsByCustomer).toHaveLength(2);
    expect(result.reportsByCustomer[0]).toEqual(
      expect.objectContaining({
        customerId: 'CUST001',
        reportContent: expect.objectContaining({
          appointmentCount: 5,
          contractCount: 2,
          serviceName: 'ServiceA',
        }),
        deliveryStatus: 'delivered',
      })
    );
    expect(result.reportsByCustomer[1]).toEqual(
      expect.objectContaining({
        customerId: 'CUST002',
        reportContent: expect.objectContaining({
          appointmentCount: 3,
          contractCount: 1,
          serviceName: 'ServiceB',
        }),
        deliveryStatus: 'delivered',
      })
    );

    // 期限超過時のエラー処理テスト（境界値）
    const overDeadlineDistributionTime = new Date('2024-01-31T10:15:00Z');
    const resultExceeded = generateAndDistributeMonthlyReport({
      salesData: salesDataList,
      config: monthlyReportConfig,
      startTimestamp: startTime.getTime(),
      generationCompleteTimestamp: generationCompleteTime.getTime(),
      distributionCompleteTimestamp: overDeadlineDistributionTime.getTime(),
    });

    expect(resultExceeded.distributionStatus).toBe('deadline_exceeded');
    expect(resultExceeded.totalProcessingTimeMinutes).toBe(75);
    expect(() => {
      if (resultExceeded.distributionStatus === 'deadline_exceeded') {
        throw new Error('期限超過');
      }
    }).toThrow(/期限超過/);
  });
});
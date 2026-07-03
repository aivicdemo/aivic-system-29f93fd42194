import { describe, test, expect } from '@jest/globals';
import {
  validateGeneratedReportQuality,
} from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1126: [error] 生成レポートの自動品質検証 - 顧客別成果指標の合計値が期待値に一致しない矛盾を検出される
  test('should detect mismatch between calculated total and reported total for customer performance indicators', () => {
    const report = {
      reportId: 'RPT-2024-01-001',
      reportMonth: '2024-01',
      generatedAt: '2024-02-01T09:00:00Z',
      customerPerformanceIndicators: [
        {
          customerId: 'CUST-001',
          customerName: 'Customer A',
          appointmentCount: 15,
          contractCount: 3,
          customerReaction: 'positive',
        },
        {
          customerId: 'CUST-002',
          customerName: 'Customer B',
          appointmentCount: 22,
          contractCount: 5,
          customerReaction: 'neutral',
        },
        {
          customerId: 'CUST-003',
          customerName: 'Customer C',
          appointmentCount: 18,
          contractCount: 4,
          customerReaction: 'positive',
        },
      ],
      summaryTotals: {
        totalAppointmentCount: 60,
        totalContractCount: 13,
      },
    };

    const validationResult = validateGeneratedReportQuality(report);

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toHaveLength(1);
    expect(validationResult.errors[0]).toMatchObject({
      errorType: '合計値不一致',
      severity: 'error',
      affectedCustomers: expect.arrayContaining(['CUST-001']),
    });
    expect(validationResult.errors[0].message).toMatch(/合計値/);
    expect(validationResult.errors[0].message).toMatch(/一致しません/);
    expect(validationResult.errors[0].expectedValue).toBe(55);
    expect(validationResult.errors[0].reportedValue).toBe(60);
  });
});
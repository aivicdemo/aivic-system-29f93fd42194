import { describe, test, expect } from '@jest/globals';
import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  // SCEN-681: [error] 月次成果レポート自動集計機能 - 集計対象期間が未確定の場合、レポート生成がスキップされる
  test('集計対象期間が未確定の状態でレポート生成処理を実行した場合、処理がスキップされエラーが記録される', () => {
    const input = {
      aggregationStartDate: null,
      aggregationEndDate: null,
      reportTemplateId: 'tpl_monthly_2024',
      customerId: 'cust_001',
      executedBy: 'user_rep_001',
      executedAt: new Date('2024-01-31T09:00:00Z'),
    };

    const result = generateMonthlySummaryReport(input);

    expect(result.isSkipped).toBe(true);
    expect(result.reportFileGenerated).toBe(false);
    expect(result.processLog).toMatch(/集計対象期間が未確定/);
    expect(result.errorMessage).toBeDefined();
    expect(result.systemHealthStatus).toBe('normal');
    expect(result.reportFilePath).toBeNull();
  });
});
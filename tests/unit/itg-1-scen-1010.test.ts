import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  test('SCEN-1010: 月次サマリーレポート生成時に計算ロジックエラーが発生した場合にエラーが検出される', () => {
    // 正常なテストデータ
    const validSummaryData = {
      month: '2024-01',
      totalRevenue: 1000000,
      transactionCount: 50,
      handlingFeeRate: 0.05,
      netRevenue: 950000,
      reportGeneratedAt: '2024-01-31T23:59:59Z'
    };

    // ケース1: 正常系 - 計算が正確に実行される
    const validResult = generateMonthlySummaryReport(validSummaryData);
    expect(validResult.status).toBe('success');
    expect(validResult.totalRevenue).toBe(1000000);
    expect(validResult.handlingFee).toBe(50000);
    expect(validResult.netRevenue).toBe(950000);
    expect(validResult.errors).toEqual([]);

    // ケース2: ゼロ除算エラー - 件数が0の場合
    const zeroDivisionData = {
      month: '2024-01',
      totalRevenue: 1000000,
      transactionCount: 0,
      handlingFeeRate: 0.05,
      netRevenue: 950000,
      reportGeneratedAt: '2024-01-31T23:59:59Z'
    };

    expect(() => generateMonthlySummaryReport(zeroDivisionData)).toThrow(/件数/);

    // ケース3: 負の値エラー - 売上金額が負値
    const negativeRevenueData = {
      month: '2024-01',
      totalRevenue: -100000,
      transactionCount: 50,
      handlingFeeRate: 0.05,
      netRevenue: -95000,
      reportGeneratedAt: '2024-01-31T23:59:59Z'
    };

    expect(() => generateMonthlySummaryReport(negativeRevenueData)).toThrow(/売上/);

    // ケース4: データ型不一致エラー - ハンドリング手数料レートが無効
    const invalidTypeData = {
      month: '2024-01',
      totalRevenue: 1000000,
      transactionCount: 50,
      handlingFeeRate: NaN,
      netRevenue: 950000,
      reportGeneratedAt: '2024-01-31T23:59:59Z'
    };

    expect(() => generateMonthlySummaryReport(invalidTypeData)).toThrow(/手数料/);

    // ケース5: 日付形式エラー
    const invalidDateData = {
      month: '2024-01',
      totalRevenue: 1000000,
      transactionCount: 50,
      handlingFeeRate: 0.05,
      netRevenue: 950000,
      reportGeneratedAt: 'invalid-date'
    };

    expect(() => generateMonthlySummaryReport(invalidDateData)).toThrow(/日付/);

    // ケース6: 必須項目欠落エラー
    const missingFieldData = {
      month: '2024-01',
      totalRevenue: 1000000,
      transactionCount: 50,
      handlingFeeRate: 0.05
    } as any;

    expect(() => generateMonthlySummaryReport(missingFieldData)).toThrow(/必須/);

    // ケース7: 整合性エラー - netRevenueが計算値と不一致
    const inconsistentData = {
      month: '2024-01',
      totalRevenue: 1000000,
      transactionCount: 50,
      handlingFeeRate: 0.05,
      netRevenue: 800000,
      reportGeneratedAt: '2024-01-31T23:59:59Z'
    };

    expect(() => generateMonthlySummaryReport(inconsistentData)).toThrow(/整合性/);

    // ケース8: 成功時のエラーログが空配列であることを確認
    const cleanResult = generateMonthlySummaryReport(validSummaryData);
    expect(Array.isArray(cleanResult.errors)).toBe(true);
    expect(cleanResult.errors.length).toBe(0);
  });
});
import { aggregateMonthlyAccuracyMetrics } from '../../src/logic/it-6-2-1-1';

describe('月次査定精度指標自動集計 - ゼロ件数時の安全処理', () => {
  test('SCEN-801: 査定件数がゼロの場合、精度指標計算が安全に処理される', () => {
    // ========== Arrange ==========
    // 当月の査定件数をゼロに設定した入力データ
    const monthlyAppraisalData = {
      year: 2024,
      month: 1,
      appraisalCount: 0,
      appraiserResultsList: [],
      constructionTypeBreakdown: [],
      amountRangeBreakdown: [],
      collectedAt: '2024-01-31T23:59:59Z',
    };

    // ========== Act ==========
    // 月次集計処理を実行
    const result = aggregateMonthlyAccuracyMetrics(monthlyAppraisalData);

    // ========== Assert ==========
    // (1) ゼロ除算エラーが発生しないこと
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // (2) 適切なデフォルト値（0またはN/A）が返却されること
    expect(result.averageProcessingTime).toBe(0);
    expect(result.accuracyRate).toBe(0);
    expect(result.uniformityIndex).toBe(0);
    expect(result.deviationRate).toBe(0);

    // (3) エラーハンドリングにより例外が正常に補足されること
    // 正常に完了している状態が (3) を満たす
    expect(result.statusCode).toBe(200);

    // (4) システムが停止することなく処理が完了すること
    // result が返却されている時点で (4) を満たす
    expect(result.completedAt).toBeDefined();

    // (5) ログに警告メッセージが記録されること
    expect(result.warningLogs).toBeDefined();
    expect(result.warningLogs.length).toBeGreaterThan(0);
    expect(result.warningLogs[0]).toMatch(/査定件数がゼロ|ゼロ件数/);

    // 追加検証: 構造の整合性
    expect(result.appraiserMetrics).toEqual([]);
    expect(result.constructionTypeMetrics).toEqual([]);
    expect(result.amountRangeMetrics).toEqual([]);
  });
});
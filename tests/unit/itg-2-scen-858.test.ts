import { aggregateMonthlyJudgmentVarianceAndDeviationTrend } from '../../src/logic/it-6-2-2-1';

describe('月次判定ばらつき率・相場乖離傾向集計機能', () => {
  test('SCEN-858: 月次査定件数がゼロの場合でも集計処理が完了し、結果テーブルに0件レコードが記録される', () => {
    const targetYearMonth = '2024-02';
    const assessorCount = 0;
    const assessmentRecords = [];

    const result = aggregateMonthlyJudgmentVarianceAndDeviationTrend({
      targetYearMonth,
      assessorCount,
      assessmentRecords,
    });

    expect(result).toEqual({
      yearMonth: '2024-02',
      completionStatus: 'completed',
      errorOccurred: false,
      recordCount: 1,
      records: [
        {
          yearMonth: '2024-02',
          totalAssessmentCount: 0,
          assessorCount: 0,
          judgmentVarianceRate: null,
          averageDeviationTrendByWorkType: null,
          averageDeviationTrendByRegion: null,
          averageDeviationTrendByAmountBand: null,
          processingCompletedAt: expect.any(String),
          dataQualityWarning: 'zero_assessments',
        },
      ],
    });

    expect(result.errorOccurred).toBe(false);
    expect(result.completionStatus).toBe('completed');
    expect(result.records[0].totalAssessmentCount).toBe(0);
    expect(result.records[0].judgmentVarianceRate).toBeNull();
    expect(result.records[0].averageDeviationTrendByWorkType).toBeNull();
    expect(result.records[0].averageDeviationTrendByRegion).toBeNull();
    expect(result.records[0].averageDeviationTrendByAmountBand).toBeNull();
    expect(result.records[0].dataQualityWarning).toBe('zero_assessments');
  });
});
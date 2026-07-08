import { calculateAssessorJudgmentAccuracyMetrics } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1282
  test('判定件数がゼロの場合、判定ばらつき率が0として正しく計測される', () => {
    const assessorId = 'ASSESSOR001';
    const judgmentRecords: Array<{
      assessorId: string;
      constructionType: string;
      priceRange: string;
      deviationRate: number;
    }> = [];

    const result = calculateAssessorJudgmentAccuracyMetrics({
      assessorId,
      judgmentRecords,
    });

    expect(result.totalJudgmentCount).toBe(0);
    expect(result.judgmentVariationRate).toBe(0);
    expect(result.assessorId).toBe('ASSESSOR001');
    expect(result.error).toBeUndefined();
  });
});
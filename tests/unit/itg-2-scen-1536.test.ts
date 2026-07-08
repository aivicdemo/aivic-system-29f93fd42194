import { calculateLearningDataUpdatePriority } from '../../src/logic/it-6-2-1-1';

describe('Learning Data Update Priority - Zero or Improvement Trend Detection', () => {
  // SCEN-1536: [edge] 学習データ更新優先度・実施タイミング自動判定機能 - 低下率がゼロまたは改善傾向の場合に更新不要と判定できる
  test('should determine no update needed when decline rate is zero or shows improvement trend', () => {
    // ケース1: 低下率がゼロ（0%）の場合
    const zeroDeclineInput = {
      ocrAccuracyDeclineRate: 0,
      aiJudgmentAccuracyDeclineRate: 0,
      feedbackIncreaseRate: 5,
      dataAgeMonths: 2,
    };

    const zeroDeclineResult = calculateLearningDataUpdatePriority(zeroDeclineInput);

    expect(zeroDeclineResult.updateRequired).toBe(false);
    expect(zeroDeclineResult.updatePriority).toBe(0);
    expect(zeroDeclineResult.implementationTiming).toBe('実施不要');
    expect(zeroDeclineResult.scheduledDate).toBeNull();

    // ケース2: 低下率が改善傾向（負の値）の場合
    const improvementTrendInput = {
      ocrAccuracyDeclineRate: -3,
      aiJudgmentAccuracyDeclineRate: -2,
      feedbackIncreaseRate: -1,
      dataAgeMonths: 3,
    };

    const improvementTrendResult = calculateLearningDataUpdatePriority(improvementTrendInput);

    expect(improvementTrendResult.updateRequired).toBe(false);
    expect(improvementTrendResult.updatePriority).toBe(0);
    expect(improvementTrendResult.implementationTiming).toBe('実施不要');
    expect(improvementTrendResult.scheduledDate).toBeNull();

    // 両ケース共通検証: 更新不要フラグが統一されていることを確認
    expect(zeroDeclineResult.updateRequired).toEqual(improvementTrendResult.updateRequired);
    expect(zeroDeclineResult.updatePriority).toEqual(improvementTrendResult.updatePriority);
  });
});
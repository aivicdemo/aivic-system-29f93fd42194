import { identifyRootCauseOfPrecisionDecline } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1149: [edge] 精度低下根本原因特定機能 - AI判定精度が前月比4.9%低下した場合、根本原因特定の対象外として判定ロジック修正を実行しない
  test('AI判定精度前月比4.9%低下時は根本原因特定対象外と判定し判定ロジック修正を実行しない', () => {
    const previousMonthAccuracy = 85.0;
    const currentMonthAccuracy = 80.1;
    const declineThresholdPercent = 5.0;

    const result = identifyRootCauseOfPrecisionDecline({
      previousMonthAiJudgmentAccuracy: previousMonthAccuracy,
      currentMonthAiJudgmentAccuracy: currentMonthAccuracy,
      declineThresholdPercent: declineThresholdPercent,
    });

    const actualDeclineRate = previousMonthAccuracy - currentMonthAccuracy;
    expect(actualDeclineRate).toBe(4.9);

    expect(result.isTargetForRootCauseAnalysis).toBe(false);
    expect(result.shouldExecuteJudgmentLogicModification).toBe(false);
    expect(result.declineRatePercent).toBe(4.9);
    expect(result.rootCauseAnalysisEligibilityReason).toBe('decline_below_threshold');
  });
});
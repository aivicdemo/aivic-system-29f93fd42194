import { judgeImprovementAchievement } from "../../src/logic/it-1-br-2-2-2-1";

describe("改善効果達成度判定と継続改善計画決定", () => {
  // SCEN-1519
  test("改善効果が目標達成度の境界値ちょうど（100%）で達成と判定される", () => {
    // 前提: 改善対象項目（査定精度、処理時間など）が選択され、目標達成度の閾値が設定されている状態
    // 発生条件: 改善効果の実績値が目標達成度の境界値ちょうど（達成度100%）で入力される
    // 結果: 達成度判定ボタンをクリックして判定処理を実行し、改善効果が『達成』と判定される

    // 入力: 改善効果達成度判定の対象データ
    const improvementMetrics = {
      targetAchievementRate: 100, // 目標達成度の閾値：100%
      assessmentAccuracyBefore: 78.5, // 改善前査定精度：78.5%
      assessmentAccuracyAfter: 85.0, // 改善後査定精度：85.0%（改善度 +6.5% → 達成度を計算）
      processingTimeBefore: 45, // 改善前平均処理時間：45分
      processingTimeAfter: 30, // 改善後平均処理時間：30分（短縮率 33.3%）
      qualityUniformityBefore: 72.0, // 改善前品質均一化指標：72.0%
      qualityUniformityAfter: 80.0, // 改善後品質均一化指標：80.0%（改善度 +8.0%）
    };

    // 期待値計算（structured.formula より）:
    // 改善度 = ((改善後値 - 改善前値) / 改善前値) * 100
    // 査定精度改善度 = ((85.0 - 78.5) / 78.5) * 100 = 8.28%
    // 処理時間短縮率 = ((45 - 30) / 45) * 100 = 33.33%
    // 品質均一化改善度 = ((80.0 - 72.0) / 72.0) * 100 = 11.11%
    // 総合改善度スコア = (査定精度改善度 + 処理時間短縮率 + 品質均一化改善度) / 3
    //                = (8.28 + 33.33 + 11.11) / 3 = 17.57%
    // ※ ただし目標達成度100%という制約がある場合、達成度判定は以下の通り：
    // 達成度 = min(総合改善度スコア / 目標達成度の基準値, 100%) = min(17.57 / 17.57, 100%) = 100%
    // （ここで基準値17.57%を達成すると100%達成と判定されるシナリオ）

    // 別シナリオ: 目標達成度の境界値がちょうど17.57%の場合、実績17.57%で達成と判定
    // → 本テストケースでは「達成度100%ちょうど」を実現するため、
    // 改善実績が目標の達成基準をちょうど満たす設定にする

    const result = judgeImprovementAchievement({
      improvementMetrics,
    });

    // 期待結果: 改善効果が『達成』と判定される
    expect(result).toEqual({
      achievementStatus: "達成", // 達成度判定結果
      achievementRate: 100, // 達成度：100%（ちょうど境界値）
      assessmentAccuracyImprovementRate: 8.28, // 査定精度改善度：8.28%
      processingTimeReductionRate: 33.33, // 処理時間短縮率：33.33%
      qualityUniformityImprovementRate: 11.11, // 品質均一化改善度：11.11%
      overallImprovementScore: 17.57, // 総合改善度スコア：17.57%
      transitionToContinuousImprovementPlan: true, // 継続改善計画決定画面への遷移：可能
      nextImprovementPhaseRecommendation: "段階的改善の継続推奨", // 次段階改善の推奨内容
    });

    // 追加検証: 継続改善計画決定画面への遷移可否と推奨内容
    expect(result.transitionToContinuousImprovementPlan).toBe(true);
    expect(result.achievementRate).toBe(100);
    expect(result.achievementStatus).toBe("達成");
  });
});
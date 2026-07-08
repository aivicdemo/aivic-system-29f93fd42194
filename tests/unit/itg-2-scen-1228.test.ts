import { calculateStatisticalSignificance } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1228: [error] 精度改善効果の統計的有意性判定 - 改善後の精度が改善前より低下した場合、ロールバックが推奨される
  test("改善後の精度が改善前より低下している場合、ロールバックが推奨される", () => {
    // Arrange: ベースライン（改善前）と改善後のデータを設定
    const baselineAccuracy = 0.90;
    const baselineSampleSize = 1000;
    const improvedAccuracy = 0.88;
    const improvedSampleSize = 1000;
    const significanceLevel = 0.05;

    // Act: 統計的有意性判定を実行
    const result = calculateStatisticalSignificance({
      baselineAccuracy,
      baselineSampleSize,
      improvedAccuracy,
      improvedSampleSize,
      significanceLevel,
    });

    // Assert: ロールバック推奨フラグがtrueであること
    expect(result.rollbackRecommended).toBe(true);

    // Assert: p値が有意水準以上であること（有意差なし = ロールバック推奨）
    expect(result.pValue).toBeGreaterThanOrEqual(significanceLevel);

    // Assert: 改善後の精度が改善前より低下していることを確認
    expect(result.accuracyDifference).toBe(-0.02);
    expect(improvedAccuracy).toBeLessThan(baselineAccuracy);

    // Assert: ロールバック推奨メッセージが含まれること
    expect(result.message).toMatch(/ロールバック/);

    // Assert: 改善失敗理由がログに記録されること
    expect(result.failureReason).toBeDefined();
    expect(result.failureReason).toBeTruthy();

    // Assert: 改善前後の精度差分がログに記録されること
    expect(result.accuracyDifferenceLogged).toBe(true);
    expect(result.baselineAccuracyLog).toBe(baselineAccuracy);
    expect(result.improvedAccuracyLog).toBe(improvedAccuracy);

    // Assert: 統計的有意性検定の結果が記録されていること
    expect(result.statisticalTestPerformed).toBe(true);
    expect(typeof result.pValue).toBe("number");
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });
});
import { calculateAccuracyImprovementMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1143
  test("悪化ケースで負の改善率と悪化の有意性判定が正確に表示される", () => {
    // Arrange: 前回査定精度85%、今回査定精度75%（悪化ケース）
    const previous_accuracy_rate = 0.85;
    const current_accuracy_rate = 0.75;
    const sample_size = 100;
    const significance_threshold = 0.05;

    // Act: 改善度自動計算実行
    const result = calculateAccuracyImprovementMetrics({
      previous_accuracy_rate,
      current_accuracy_rate,
      sample_size,
      significance_threshold,
    });

    // Assert
    // 1. 改善率が負の値（-10%または-0.10）で表示されることを検証
    expect(result.improvement_rate_percent).toBe(-10);
    expect(result.improvement_rate_decimal).toBe(-0.1);

    // 2. ステータスに「悪化」と表示されることを検証
    expect(result.status_label).toBe("悪化");

    // 3. 悪化の有意性判定が統計的に正確に実施されていることを検証
    // p値が有意水準(0.05)以下であることを確認（悪化が統計的に有意）
    expect(result.is_statistically_significant).toBe(true);
    expect(result.p_value).toBeLessThanOrEqual(significance_threshold);

    // 4. 有意な悪化である場合が明確に表示されることを検証
    expect(result.significance_label).toBe("有意な悪化");

    // 5. 改善度レベル（段階評価）が「低下」であることを検証
    expect(result.improvement_level).toBe("低下");

    // 6. 追加検証: 信頼区間が計算されていることを確認
    expect(result.confidence_interval_lower).toBeDefined();
    expect(result.confidence_interval_upper).toBeDefined();
    expect(result.confidence_interval_lower).toBeLessThan(
      result.confidence_interval_upper
    );
  });
});
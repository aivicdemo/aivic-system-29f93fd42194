import { evaluateDivergenceRange } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-990: 乖離許容範囲の自動判定 - 乖離率が許容範囲内（例：±10%）の場合、警告なしで判定が完了する", () => {
    // Arrange
    const standard_assessment_amount = 100000;
    const actual_assessment_amount = 105000;
    const tolerance_range_percent = 10;

    // Calculate divergence rate
    const divergence_rate = ((actual_assessment_amount - standard_assessment_amount) / standard_assessment_amount) * 100;

    // Act
    const result = evaluateDivergenceRange({
      standard_amount: standard_assessment_amount,
      actual_amount: actual_assessment_amount,
      tolerance_range: tolerance_range_percent,
    });

    // Assert
    expect(result.divergence_rate).toBe(5);
    expect(result.is_within_tolerance).toBe(true);
    expect(result.warning_message).toBe("");
    expect(result.judgment_status).toBe("OK");
    expect(result.judgment_result).toBe("合格");
  });
});
import { validateInvoiceAmountAnomaly } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求額異常値判定・承認フロー自動決定機能", () => {
  test("SCEN-898: 前月比変動が許容範囲の上限ジャストの場合は要確認と判定される", () => {
    // Arrange
    const previousMonthAmount = 100000;
    const currentMonthAmount = 110000;
    const variationThresholdPercentage = 10;

    // Act
    const result = validateInvoiceAmountAnomaly({
      previousMonthAmount,
      currentMonthAmount,
      variationThresholdPercentage,
    });

    // Assert - 請求額異常値判定の結果が『要確認』と判定されること
    expect(result.anomalyStatus).toBe("REVIEW_REQUIRED");

    // 承認フロー自動決定機能により『要確認フロー』が自動決定されること
    expect(result.approvalFlow).toBe("REVIEW_FLOW");

    // 変動率の詳細確認
    expect(result.variationRate).toBe(10);

    // 判定理由が記録されていることを確認
    expect(result.reason).toMatch(/許容範囲/);
  });
});
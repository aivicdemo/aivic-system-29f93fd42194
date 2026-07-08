import { calculateCustomizationCost } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1386
  test("精度低下許容範囲判定機能 - 他部署精度が基準精度より15%低い場合、許容範囲超過と判定されカスタマイズコストが算出される", () => {
    // Arrange
    const baselineAccuracy = 80;
    const otherDepartmentAccuracy = 65;
    const toleranceThreshold = 10;

    // Act
    const result = calculateCustomizationCost({
      baselineAccuracy,
      otherDepartmentAccuracy,
      toleranceThreshold,
    });

    // Assert
    expect(result.accuracyDifference).toBe(15);
    expect(result.isWithinTolerance).toBe(false);
    expect(result.status).toBe("許容範囲超過");
    expect(result.customizationCost).toBe(450000);
  });
});
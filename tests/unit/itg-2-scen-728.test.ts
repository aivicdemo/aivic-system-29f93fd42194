import { calculateDeviation } from "../../src/logic/it-6-2-2-2";

describe("相場乖離率段階別表示", () => {
  test("SCEN-728: 乖離率が正常範囲（±10%以内）の場合、正常表示される", () => {
    // Arrange
    const basePrice = 1000;
    const quotedPrice = 1050;
    const deviationThresholdNormal = 10;
    const deviationThresholdWarning = 20;

    // Act
    const result = calculateDeviation({
      basePrice,
      quotedPrice,
      thresholdNormalUpperBound: deviationThresholdNormal,
      thresholdNormalLowerBound: -deviationThresholdNormal,
      thresholdWarningUpperBound: deviationThresholdWarning,
      thresholdWarningLowerBound: -deviationThresholdWarning,
    });

    // Assert - 1) 乖離率の数値が正確に表示されること
    expect(result.deviationPercentage).toBe(5);

    // Assert - 2) ステータスが「正常」として表示されること
    expect(result.status).toBe("normal");

    // Assert - 3) 表示色が正常を示す色（緑色）で表示されること
    expect(result.displayColor).toBe("green");

    // Assert - 4) エラーメッセージやアラートが表示されないこと
    expect(result.alertMessage).toBe("");
    expect(result.hasError).toBe(false);

    // Additional assertions for data consistency
    expect(result.statusLabel).toBe("正常");
    expect(result.deviationAmount).toBe(50);
  });
});
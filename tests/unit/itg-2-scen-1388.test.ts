import { analyzeAssessorAccuracyDivergence } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1388: 精度低下許容範囲判定機能 - 他部署精度が基準精度と同等の場合、許容範囲内と判定される", () => {
    // Arrange: テストデータセットを準備
    const baselineAccuracy = 75.0;
    const otherDepartmentAccuracy = 75.0;
    const toleranceThreshold = 5.0;

    // Act: 許容範囲判定機能を実行
    const result = analyzeAssessorAccuracyDivergence({
      baselineAccuracy,
      otherDepartmentAccuracy,
      toleranceThreshold,
    });

    // Assert: 許容範囲判定の結果を検証
    expect(result).toEqual({
      isWithinTolerance: true,
      accuracyDifference: 0.0,
      assessmentStatus: "許容範囲内",
      accuracyDeclineDetected: false,
      baselineAccuracy: 75.0,
      otherDepartmentAccuracy: 75.0,
    });
    expect(result.isWithinTolerance).toBe(true);
    expect(result.accuracyDeclineDetected).toBe(false);
    expect(result.accuracyDifference).toBe(0.0);
    expect(result.assessmentStatus).toBe("許容範囲内");
  });
});
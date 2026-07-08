import { assignDivergencePriorityLevel } from "../../src/logic/it-6-2-2-1";

describe("乖離根拠の検証優先度自動付与 - 境界値テスト", () => {
  // SCEN-834: [edge] 乖離根拠の検証優先度自動付与 - 許容範囲の境界値（上限値・下限値）ジャストの乖離に『中』が付与される
  test("許容範囲の下限値・上限値ジャストの乖離に検証優先度『中』が付与される", () => {
    // 許容範囲 ±5% のシナリオ
    const toleranceLowerBound = -5.0;
    const toleranceUpperBound = 5.0;

    // 下限値ジャストのテスト: -5.0%
    const divergenceAtLowerBound = -5.0;
    const resultLowerBound = assignDivergencePriorityLevel({
      divergenceRatePercent: divergenceAtLowerBound,
      toleranceLowerBound: toleranceLowerBound,
      toleranceUpperBound: toleranceUpperBound,
    });
    expect(resultLowerBound.priorityLevel).toBe("中");
    expect(resultLowerBound.divergenceRatePercent).toBe(-5.0);
    expect(resultLowerBound.withinTolerance).toBe(true);

    // 上限値ジャストのテスト: +5.0%
    const divergenceAtUpperBound = 5.0;
    const resultUpperBound = assignDivergencePriorityLevel({
      divergenceRatePercent: divergenceAtUpperBound,
      toleranceLowerBound: toleranceLowerBound,
      toleranceUpperBound: toleranceUpperBound,
    });
    expect(resultUpperBound.priorityLevel).toBe("中");
    expect(resultUpperBound.divergenceRatePercent).toBe(5.0);
    expect(resultUpperBound.withinTolerance).toBe(true);

    // 境界値より内側（許容範囲内）: -4.5% → 『低』
    const divergenceInsideLower = -4.5;
    const resultInsideLower = assignDivergencePriorityLevel({
      divergenceRatePercent: divergenceInsideLower,
      toleranceLowerBound: toleranceLowerBound,
      toleranceUpperBound: toleranceUpperBound,
    });
    expect(resultInsideLower.priorityLevel).toBe("低");

    // 境界値より内側（許容範囲内）: +4.5% → 『低』
    const divergenceInsideUpper = 4.5;
    const resultInsideUpper = assignDivergencePriorityLevel({
      divergenceRatePercent: divergenceInsideUpper,
      toleranceLowerBound: toleranceLowerBound,
      toleranceUpperBound: toleranceUpperBound,
    });
    expect(resultInsideUpper.priorityLevel).toBe("低");

    // 境界値より外側（許容範囲超過）: -5.1% → 『高』
    const divergenceBeyondLower = -5.1;
    const resultBeyondLower = assignDivergencePriorityLevel({
      divergenceRatePercent: divergenceBeyondLower,
      toleranceLowerBound: toleranceLowerBound,
      toleranceUpperBound: toleranceUpperBound,
    });
    expect(resultBeyondLower.priorityLevel).toBe("高");
    expect(resultBeyondLower.withinTolerance).toBe(false);

    // 境界値より外側（許容範囲超過）: +5.1% → 『高』
    const divergenceBeyondUpper = 5.1;
    const resultBeyondUpper = assignDivergencePriorityLevel({
      divergenceRatePercent: divergenceBeyondUpper,
      toleranceLowerBound: toleranceLowerBound,
      toleranceUpperBound: toleranceUpperBound,
    });
    expect(resultBeyondUpper.priorityLevel).toBe("高");
    expect(resultBeyondUpper.withinTolerance).toBe(false);
  });
});
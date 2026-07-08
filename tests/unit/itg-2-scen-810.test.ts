import { classifyDeviationPattern } from "../../src/logic/it-1-br-6-2-1";

describe("相場乖離パターン自動分類機能", () => {
  // SCEN-810
  test("標準範囲の上限・下限の境界値で正しくパターン分類が遷移する", () => {
    // 下限値での分類: -10% は正常パターン
    const resultAtLowerBound = classifyDeviationPattern({
      deviationRatePercent: -10.0,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultAtLowerBound).toEqual({
      pattern: "standard",
      isWithinRange: true,
      deviationRatePercent: -10.0,
    });

    // 下限値を下回る値での分類: -10.1% は乖離パターンに遷移
    const resultBelowLowerBound = classifyDeviationPattern({
      deviationRatePercent: -10.1,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultBelowLowerBound).toEqual({
      pattern: "excess_low",
      isWithinRange: false,
      deviationRatePercent: -10.1,
    });

    // 上限値での分類: +10% は正常パターン
    const resultAtUpperBound = classifyDeviationPattern({
      deviationRatePercent: 10.0,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultAtUpperBound).toEqual({
      pattern: "standard",
      isWithinRange: true,
      deviationRatePercent: 10.0,
    });

    // 上限値を上回る値での分類: +10.1% は乖離パターンに遷移
    const resultAboveUpperBound = classifyDeviationPattern({
      deviationRatePercent: 10.1,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultAboveUpperBound).toEqual({
      pattern: "excess_high",
      isWithinRange: false,
      deviationRatePercent: 10.1,
    });

    // 中央値での分類: 0% は正常パターン
    const resultAtCenter = classifyDeviationPattern({
      deviationRatePercent: 0.0,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultAtCenter).toEqual({
      pattern: "standard",
      isWithinRange: true,
      deviationRatePercent: 0.0,
    });

    // 範囲内の値（-5%）での分類: 正常パターン
    const resultWithinRangeNegative = classifyDeviationPattern({
      deviationRatePercent: -5.0,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultWithinRangeNegative).toEqual({
      pattern: "standard",
      isWithinRange: true,
      deviationRatePercent: -5.0,
    });

    // 範囲内の値（+5%）での分類: 正常パターン
    const resultWithinRangePositive = classifyDeviationPattern({
      deviationRatePercent: 5.0,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultWithinRangePositive).toEqual({
      pattern: "standard",
      isWithinRange: true,
      deviationRatePercent: 5.0,
    });

    // 大きく乖離した値（-20%）での分類: 乖離パターン
    const resultFarBelowLowerBound = classifyDeviationPattern({
      deviationRatePercent: -20.0,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultFarBelowLowerBound).toEqual({
      pattern: "excess_low",
      isWithinRange: false,
      deviationRatePercent: -20.0,
    });

    // 大きく乖離した値（+20%）での分類: 乖離パターン
    const resultFarAboveUpperBound = classifyDeviationPattern({
      deviationRatePercent: 20.0,
      standardRangeLowerPercent: -10.0,
      standardRangeUpperPercent: 10.0,
    });
    expect(resultFarAboveUpperBound).toEqual({
      pattern: "excess_high",
      isWithinRange: false,
      deviationRatePercent: 20.0,
    });
  });
});
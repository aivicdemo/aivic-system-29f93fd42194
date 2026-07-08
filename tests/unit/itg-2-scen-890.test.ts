import { calculatePriceRangeAndDeviationMargin } from '../../src/logic/it-6-2-1-1';

describe('相場範囲と許容乖離幅の算出', () => {
  test('SCEN-890: 外れ値を含むデータセットから統計値が正しく算出される', () => {
    // テストデータ: 正常値（100万円～150万円）+ 外れ値（30万円と200万円）
    const priceDataWithOutliers = [
      1000000, // 正常値
      1200000, // 正常値
      1100000, // 正常値
      1300000, // 正常値
      1150000, // 正常値
      1250000, // 正常値
      1180000, // 正常値
      1220000, // 正常値
      1050000, // 正常値
      1400000, // 正常値
      300000,  // 外れ値（低）
      2000000, // 外れ値（高）
    ];

    const result = calculatePriceRangeAndDeviationMargin(priceDataWithOutliers);

    // 外れ値を除外したデータセット（10個の正常値のみ）
    // 正常値: [1000000, 1200000, 1100000, 1300000, 1150000, 1250000, 1180000, 1220000, 1050000, 1400000]
    // ソート: [1000000, 1050000, 1100000, 1150000, 1180000, 1200000, 1220000, 1250000, 1300000, 1400000]

    // 平均値の検証: (1000000 + 1050000 + 1100000 + 1150000 + 1180000 + 1200000 + 1220000 + 1250000 + 1300000 + 1400000) / 10 = 11650000 / 10
    const expectedMean = 1165000;
    expect(result.mean).toBe(expectedMean);

    // 中央値の検証（10個のデータ）: (1180000 + 1200000) / 2
    const expectedMedian = 1190000;
    expect(result.median).toBe(expectedMedian);

    // 最小値の検証（外れ値30万円を除外）
    const expectedMin = 1000000;
    expect(result.min).toBe(expectedMin);

    // 最大値の検証（外れ値200万円を除外）
    const expectedMax = 1400000;
    expect(result.max).toBe(expectedMax);

    // 標準偏差の検証
    // 分散 = Σ(xi - mean)^2 / n
    // = [(1000000-1165000)^2 + (1050000-1165000)^2 + (1100000-1165000)^2 + (1150000-1165000)^2 + (1180000-1165000)^2 + (1200000-1165000)^2 + (1220000-1165000)^2 + (1250000-1165000)^2 + (1300000-1165000)^2 + (1400000-1165000)^2] / 10
    // = [27225000000 + 13225000000 + 4225000000 + 225000000 + 225000000 + 1225000000 + 3025000000 + 7225000000 + 18225000000 + 55225000000] / 10
    // = 130250000000 / 10 = 13025000000
    // 標準偏差 = √13025000000 ≈ 114083.11
    const expectedStdDev = 114083.11;
    expect(Math.abs(result.standardDeviation - expectedStdDev)).toBeLessThan(1);

    // 許容乖離幅の検証（業界標準 ±15%）
    // 乖離幅下限 = mean * (1 - 0.15) = 1165000 * 0.85 = 990250
    // 乖離幅上限 = mean * (1 + 0.15) = 1165000 * 1.15 = 1339750
    const expectedMarginLower = 990250;
    const expectedMarginUpper = 1339750;
    expect(result.deviationMarginLower).toBe(expectedMarginLower);
    expect(result.deviationMarginUpper).toBe(expectedMarginUpper);

    // 外れ値除外フラグの検認
    expect(result.outliersRemoved).toBe(true);
    expect(result.removedOutlierCount).toBe(2);

    // 相場範囲の検証
    expect(result.priceRange).toEqual({
      min: expectedMin,
      max: expectedMax,
      median: expectedMedian,
    });

    // データセット統計情報の検証
    expect(result.datasetStats).toEqual({
      originalCount: 12,
      cleanedCount: 10,
      outlierCount: 2,
    });

    // 許容乖離幅の検証（パーセンテージ表示）
    expect(result.deviationMarginPercentage).toBe(15);
  });
});
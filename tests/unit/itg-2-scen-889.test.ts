import { calculatePriceRangeAndTolerances } from "../../src/logic/it-6-2-1-1";

describe("相場範囲と許容乖離幅の算出", () => {
  // SCEN-889: [normal] 相場範囲と許容乖離幅の算出 - 中央値・四分位数・標準偏差から相場範囲が正確に計算される
  test("中央値・四分位数・標準偏差から相場範囲と許容乖離幅が正確に計算される", () => {
    // テストデータ準備: 複数の査定データ（25件）
    const estimateDataPoints = [
      { id: 1, amount: 950000 },
      { id: 2, amount: 1000000 },
      { id: 3, amount: 1050000 },
      { id: 4, amount: 1100000 },
      { id: 5, amount: 1150000 },
      { id: 6, amount: 1200000 },
      { id: 7, amount: 1250000 },
      { id: 8, amount: 1300000 },
      { id: 9, amount: 1350000 },
      { id: 10, amount: 1400000 },
      { id: 11, amount: 1450000 },
      { id: 12, amount: 1500000 },
      { id: 13, amount: 1550000 },
      { id: 14, amount: 1600000 },
      { id: 15, amount: 1650000 },
      { id: 16, amount: 1700000 },
      { id: 17, amount: 1750000 },
      { id: 18, amount: 1800000 },
      { id: 19, amount: 1850000 },
      { id: 20, amount: 1900000 },
      { id: 21, amount: 1950000 },
      { id: 22, amount: 2000000 },
      { id: 23, amount: 2050000 },
      { id: 24, amount: 2100000 },
      { id: 25, amount: 2150000 },
    ];

    const result = calculatePriceRangeAndTolerances({
      estimateDataPoints,
    });

    // 中央値の計算検証: 25個のソート済みデータの13番目 = 1500000
    expect(result.median).toBe(1500000);

    // 第1四分位数（Q1）の計算検証: 下半分12個のデータの中央値
    // 下半分: [950000, 1000000, ..., 1450000] のうち位置7と8の平均 = (1200000 + 1250000) / 2 = 1225000
    expect(result.q1).toBe(1225000);

    // 第3四分位数（Q3）の計算検証: 上半分12個のデータの中央値
    // 上半分: [1550000, 1600000, ..., 2150000] のうち位置18と19の平均 = (1800000 + 1850000) / 2 = 1825000
    expect(result.q3).toBe(1825000);

    // 標準偏差の計算検証
    // 平均 = 1550000
    // 分散 = ((950000-1550000)^2 + (1000000-1550000)^2 + ... + (2150000-1550000)^2) / 25
    // 分散 ≈ 176041666666.67
    // 標準偏差 ≈ 419574.05
    expect(Math.abs(result.standardDeviation - 419574.05) < 1).toBe(true);

    // 相場範囲下限の計算検証
    // 下限 = Q1 - 1.5 * (Q3 - Q1) = 1225000 - 1.5 * (1825000 - 1225000) = 1225000 - 900000 = 325000
    expect(result.priceRangeLower).toBe(325000);

    // 相場範囲上限の計算検証
    // 上限 = Q3 + 1.5 * (Q3 - Q1) = 1825000 + 1.5 * (1825000 - 1225000) = 1825000 + 900000 = 2725000
    expect(result.priceRangeUpper).toBe(2725000);

    // 許容乖離幅の計算検証
    // 許容乖離幅 = (上限 - 下限) / 2 = (2725000 - 325000) / 2 = 1200000
    expect(result.allowedDeviationWidth).toBe(1200000);

    // 相場範囲内に含まれるべきデータポイント検証
    // すべてのテストデータが [325000, 2725000] 内に含まれる
    const pointsWithinRange = result.dataPointsClassification.within;
    expect(pointsWithinRange).toHaveLength(25);
    expect(pointsWithinRange.every((dp) => dp.amount >= 325000 && dp.amount <= 2725000)).toBe(true);

    // 相場範囲外に含まれるべきデータポイント検証
    // このテストデータセットではすべてが範囲内なので、外側は0件
    const pointsOutsideRange = result.dataPointsClassification.outside;
    expect(pointsOutsideRange).toHaveLength(0);

    // 許容乖離幅から計算された上下限値の検証
    // 下限: 中央値 - 許容乖離幅 = 1500000 - 1200000 = 300000
    // 上限: 中央値 + 許容乖離幅 = 1500000 + 1200000 = 2700000
    expect(result.toleranceRangeLower).toBe(300000);
    expect(result.toleranceRangeUpper).toBe(2700000);

    // 結果オブジェクトの構造検証
    expect(result).toHaveProperty("median");
    expect(result).toHaveProperty("q1");
    expect(result).toHaveProperty("q3");
    expect(result).toHaveProperty("standardDeviation");
    expect(result).toHaveProperty("priceRangeLower");
    expect(result).toHaveProperty("priceRangeUpper");
    expect(result).toHaveProperty("allowedDeviationWidth");
    expect(result).toHaveProperty("toleranceRangeLower");
    expect(result).toHaveProperty("toleranceRangeUpper");
    expect(result).toHaveProperty("dataPointsClassification");
  });
});
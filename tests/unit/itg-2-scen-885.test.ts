import { calculateTrustScoreForHistoricalData } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-885: 過去案件データのフィルタリング・有効性判定 - 信頼度スコアが0.0～1.0の範囲内で正確に算出される", () => {
    // ===== ハッピーパス: 通常の過去案件データセット =====
    const historicalDataNormal = [
      {
        projectId: "PRJ001",
        region: "tokyo",
        constructionType: "concrete",
        amountBand: "1000000-5000000",
        sampleSize: 12,
        timeSpanMonths: 36,
        dataFreshnessScore: 0.8,
        regionCoverageScore: 0.9,
        dataConsistencyScore: 0.85,
      },
      {
        projectId: "PRJ002",
        region: "osaka",
        constructionType: "steel",
        amountBand: "5000000-10000000",
        sampleSize: 24,
        timeSpanMonths: 24,
        dataFreshnessScore: 0.9,
        regionCoverageScore: 0.95,
        dataConsistencyScore: 0.92,
      },
      {
        projectId: "PRJ003",
        region: "kyoto",
        constructionType: "wood",
        amountBand: "500000-1000000",
        sampleSize: 8,
        timeSpanMonths: 12,
        dataFreshnessScore: 0.7,
        regionCoverageScore: 0.75,
        dataConsistencyScore: 0.72,
      },
    ];

    const results = historicalDataNormal.map((data) =>
      calculateTrustScoreForHistoricalData(data)
    );

    // すべての信頼度スコアが 0.0 ～ 1.0 の範囲内であることを確認
    results.forEach((result) => {
      expect(result.trustScore).toBeGreaterThanOrEqual(0.0);
      expect(result.trustScore).toBeLessThanOrEqual(1.0);
    });

    // 通常データセットの期待値（加重平均で計算）
    // PRJ001: (0.8 * 0.3 + 0.9 * 0.4 + 0.85 * 0.3) = 0.855
    expect(results[0].trustScore).toBeCloseTo(0.855, 3);
    // PRJ002: (0.9 * 0.3 + 0.95 * 0.4 + 0.92 * 0.3) = 0.921
    expect(results[1].trustScore).toBeCloseTo(0.921, 3);
    // PRJ003: (0.7 * 0.3 + 0.75 * 0.4 + 0.72 * 0.3) = 0.726
    expect(results[2].trustScore).toBeCloseTo(0.726, 3);

    // ===== エッジケース: 最小値 0.0 =====
    const dataMinimumEdge = {
      projectId: "PRJ_MIN",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 1,
      timeSpanMonths: 1,
      dataFreshnessScore: 0.0,
      regionCoverageScore: 0.0,
      dataConsistencyScore: 0.0,
    };

    const resultMin = calculateTrustScoreForHistoricalData(dataMinimumEdge);
    expect(resultMin.trustScore).toBe(0.0);

    // ===== エッジケース: 最大値 1.0 =====
    const dataMaximumEdge = {
      projectId: "PRJ_MAX",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 100,
      timeSpanMonths: 120,
      dataFreshnessScore: 1.0,
      regionCoverageScore: 1.0,
      dataConsistencyScore: 1.0,
    };

    const resultMax = calculateTrustScoreForHistoricalData(dataMaximumEdge);
    expect(resultMax.trustScore).toBe(1.0);

    // ===== 範囲外の値に対するハンドリング: 負の値 =====
    const dataNegativeValue = {
      projectId: "PRJ_NEG",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 10,
      timeSpanMonths: 12,
      dataFreshnessScore: -0.1,
      regionCoverageScore: 0.8,
      dataConsistencyScore: 0.75,
    };

    expect(() =>
      calculateTrustScoreForHistoricalData(dataNegativeValue)
    ).toThrow(/信頼度スコア|範囲|負/);

    // ===== 範囲外の値に対するハンドリング: 1.0を超える値 =====
    const dataExceeds = {
      projectId: "PRJ_EXC",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 10,
      timeSpanMonths: 12,
      dataFreshnessScore: 1.05,
      regionCoverageScore: 0.8,
      dataConsistencyScore: 0.75,
    };

    expect(() =>
      calculateTrustScoreForHistoricalData(dataExceeds)
    ).toThrow(/信頼度スコア|範囲|超過|上限/);

    // ===== 小数点精度検証: 複数の精密値 =====
    const dataPrecision1 = {
      projectId: "PRJ_PREC1",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 15,
      timeSpanMonths: 30,
      dataFreshnessScore: 0.567,
      regionCoverageScore: 0.678,
      dataConsistencyScore: 0.789,
    };

    const resultPrecision1 =
      calculateTrustScoreForHistoricalData(dataPrecision1);
    // 期待値: (0.567 * 0.3 + 0.678 * 0.4 + 0.789 * 0.3) = 0.6948
    expect(resultPrecision1.trustScore).toBeCloseTo(0.6948, 4);
    expect(resultPrecision1.trustScore).toBeGreaterThanOrEqual(0.0);
    expect(resultPrecision1.trustScore).toBeLessThanOrEqual(1.0);

    const dataPrecision2 = {
      projectId: "PRJ_PREC2",
      region: "osaka",
      constructionType: "steel",
      amountBand: "5000000-10000000",
      sampleSize: 20,
      timeSpanMonths: 48,
      dataFreshnessScore: 0.234,
      regionCoverageScore: 0.345,
      dataConsistencyScore: 0.456,
    };

    const resultPrecision2 =
      calculateTrustScoreForHistoricalData(dataPrecision2);
    // 期待値: (0.234 * 0.3 + 0.345 * 0.4 + 0.456 * 0.3) = 0.3489
    expect(resultPrecision2.trustScore).toBeCloseTo(0.3489, 4);
    expect(resultPrecision2.trustScore).toBeGreaterThanOrEqual(0.0);
    expect(resultPrecision2.trustScore).toBeLessThanOrEqual(1.0);

    // ===== 複数過去案件データに対する一括検証 =====
    const historicalDataBatch = [
      {
        projectId: "PRJ_B1",
        region: "tokyo",
        constructionType: "concrete",
        amountBand: "1000000-5000000",
        sampleSize: 10,
        timeSpanMonths: 24,
        dataFreshnessScore: 0.5,
        regionCoverageScore: 0.6,
        dataConsistencyScore: 0.7,
      },
      {
        projectId: "PRJ_B2",
        region: "osaka",
        constructionType: "steel",
        amountBand: "5000000-10000000",
        sampleSize: 30,
        timeSpanMonths: 36,
        dataFreshnessScore: 0.8,
        regionCoverageScore: 0.85,
        dataConsistencyScore: 0.9,
      },
      {
        projectId: "PRJ_B3",
        region: "kyoto",
        constructionType: "wood",
        amountBand: "500000-1000000",
        sampleSize: 5,
        timeSpanMonths: 12,
        dataFreshnessScore: 0.3,
        regionCoverageScore: 0.4,
        dataConsistencyScore: 0.5,
      },
      {
        projectId: "PRJ_B4",
        region: "fukuoka",
        constructionType: "metal",
        amountBand: "2000000-5000000",
        sampleSize: 18,
        timeSpanMonths: 30,
        dataFreshnessScore: 0.75,
        regionCoverageScore: 0.8,
        dataConsistencyScore: 0.85,
      },
    ];

    const batchResults = historicalDataBatch.map((data) =>
      calculateTrustScoreForHistoricalData(data)
    );

    // すべてのバッチ結果が 0.0 ～ 1.0 の範囲内であることを確認
    batchResults.forEach((result, idx) => {
      expect(result.trustScore).toBeGreaterThanOrEqual(0.0);
      expect(result.trustScore).toBeLessThanOrEqual(1.0);
      expect(result.projectId).toBe(historicalDataBatch[idx].projectId);
    });

    // 各結果の期待値を検証
    // PRJ_B1: (0.5 * 0.3 + 0.6 * 0.4 + 0.7 * 0.3) = 0.61
    expect(batchResults[0].trustScore).toBeCloseTo(0.61, 3);
    // PRJ_B2: (0.8 * 0.3 + 0.85 * 0.4 + 0.9 * 0.3) = 0.855
    expect(batchResults[1].trustScore).toBeCloseTo(0.855, 3);
    // PRJ_B3: (0.3 * 0.3 + 0.4 * 0.4 + 0.5 * 0.3) = 0.4
    expect(batchResults[2].trustScore).toBeCloseTo(0.4, 3);
    // PRJ_B4: (0.75 * 0.3 + 0.8 * 0.4 + 0.85 * 0.3) = 0.8
    expect(batchResults[3].trustScore).toBeCloseTo(0.8, 3);

    // ===== 小数点精度が正確であることを確認（複数小数点） =====
    const dataPrecisionComplex = {
      projectId: "PRJ_PREC_COMPLEX",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 25,
      timeSpanMonths: 30,
      dataFreshnessScore: 0.123,
      regionCoverageScore: 0.456,
      dataConsistencyScore: 0.789,
    };

    const resultComplex =
      calculateTrustScoreForHistoricalData(dataPrecisionComplex);
    // 期待値: (0.123 * 0.3 + 0.456 * 0.4 + 0.789 * 0.3) = 0.4629
    expect(resultComplex.trustScore).toBeCloseTo(0.4629, 4);
    expect(resultComplex.trustScore).toBeGreaterThanOrEqual(0.0);
    expect(resultComplex.trustScore).toBeLessThanOrEqual(1.0);

    // ===== 境界値の厳密性検証 =====
    // exactlyMin: 0.0 に極めて近い値
    const dataAlmostMin = {
      projectId: "PRJ_ALMOST_MIN",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 2,
      timeSpanMonths: 2,
      dataFreshnessScore: 0.0001,
      regionCoverageScore: 0.0001,
      dataConsistencyScore: 0.0001,
    };

    const resultAlmostMin =
      calculateTrustScoreForHistoricalData(dataAlmostMin);
    expect(resultAlmostMin.trustScore).toBeGreaterThanOrEqual(0.0);
    expect(resultAlmostMin.trustScore).toBeLessThanOrEqual(1.0);
    expect(resultAlmostMin.trustScore).toBeCloseTo(0.0001, 4);

    // exactlyMax: 1.0 に極めて近い値
    const dataAlmostMax = {
      projectId: "PRJ_ALMOST_MAX",
      region: "tokyo",
      constructionType: "concrete",
      amountBand: "1000000-5000000",
      sampleSize: 50,
      timeSpanMonths: 60,
      dataFreshnessScore: 0.9999,
      regionCoverageScore: 0.9999,
      dataConsistencyScore: 0.9999,
    };

    const resultAlmostMax =
      calculateTrustScoreForHistoricalData(dataAlmostMax);
    expect(resultAlmostMax.trustScore).toBeGreaterThanOrEqual(0.0);
    expect(resultAlmostMax.trustScore).toBeLessThanOrEqual(1.0);
    expect(resultAlmostMax.trustScore).toBeCloseTo(0.9999, 4);
  });
});
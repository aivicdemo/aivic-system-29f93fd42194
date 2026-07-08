import { calculateDeviationRate, judgeDeviationTolerance } from '../../src/logic/it-1-br-6-2-1';

describe('乖離許容範囲の自動判定 - 境界値テスト', () => {
  // SCEN-992: [edge] 乖離許容範囲の自動判定 - 乖離率がちょうど許容範囲の境界値（±10.0%）の場合、警告なしで許容と判定される
  test('乖離率が+10.0%および-10.0%のときは警告なしで許容と判定される', () => {
    const benchmarkPrice = 1000000; // 基準価格: 100万円
    const toleranceThreshold = 10.0; // 許容乖離率: ±10.0%

    // ケース 1: 乖離率が+10.0%（査定価格: 110万円）
    const assessmentPricePlus = 1100000;
    const deviationRatePlus = calculateDeviationRate(assessmentPricePlus, benchmarkPrice);
    const judgmentPlus = judgeDeviationTolerance(deviationRatePlus, toleranceThreshold);

    expect(deviationRatePlus).toBe(10.0);
    expect(judgmentPlus).toEqual({
      isWithinTolerance: true,
      deviationRate: 10.0,
      hasWarning: false,
      warningMessage: null,
      judgmentResult: '許容'
    });

    // ケース 2: 乖離率が-10.0%（査定価格: 90万円）
    const assessmentPriceMinus = 900000;
    const deviationRateMinus = calculateDeviationRate(assessmentPriceMinus, benchmarkPrice);
    const judgmentMinus = judgeDeviationTolerance(deviationRateMinus, toleranceThreshold);

    expect(deviationRateMinus).toBe(-10.0);
    expect(judgmentMinus).toEqual({
      isWithinTolerance: true,
      deviationRate: -10.0,
      hasWarning: false,
      warningMessage: null,
      judgmentResult: '許容'
    });
  });
});
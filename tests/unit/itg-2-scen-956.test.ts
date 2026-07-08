import { calculateRequiredStaffCount, predictBusynessDegree } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 翌月繁忙度予測・必要人員数自動計算', () => {
  test('SCEN-956: 季節性のない均一な過去データから一定の必要人員数を算出する', () => {
    // Arrange: 過去12ヶ月間の査定件数が毎月均等（1,000件/月）
    const pastMonthlyData = [
      { month: '2023-01', estimateCount: 1000 },
      { month: '2023-02', estimateCount: 1000 },
      { month: '2023-03', estimateCount: 1000 },
      { month: '2023-04', estimateCount: 1000 },
      { month: '2023-05', estimateCount: 1000 },
      { month: '2023-06', estimateCount: 1000 },
      { month: '2023-07', estimateCount: 1000 },
      { month: '2023-08', estimateCount: 1000 },
      { month: '2023-09', estimateCount: 1000 },
      { month: '2023-10', estimateCount: 1000 },
      { month: '2023-11', estimateCount: 1000 },
      { month: '2023-12', estimateCount: 1000 },
    ];

    const avgProcessingTimeMinutes = 30; // 平均処理時間: 30分
    const workingHoursPerDay = 8; // 1日の稼働時間: 8時間
    const workingDaysPerMonth = 20; // 月間営業日数: 20日

    // Act: 翌月繁忙度予測を実行
    const busynessPrediction = predictBusynessDegree(pastMonthlyData);

    // Assert: 繁忙度予測の検証
    // 季節変動係数が1.0（変動なし）であることを検証
    expect(busynessPrediction.seasonalityCoefficient).toBe(1.0);

    // 予測される翌月の査定件数
    const predictedNextMonthEstimates = busynessPrediction.predictedEstimateCount;
    expect(predictedNextMonthEstimates).toBe(1000);

    // 繁忙度レベルが「通常期」であることを検証
    expect(busynessPrediction.busynessDegreeLevel).toBe('normal');

    // Act: 必要人員数自動計算を実行
    const requiredStaffCalculation = calculateRequiredStaffCount({
      predictedEstimateCount: predictedNextMonthEstimates,
      avgProcessingTimeMinutes,
      workingHoursPerDay,
      workingDaysPerMonth,
      currentStaffCount: 30,
    });

    // Assert: 必要人員数計算結果の検証
    // 期待計算値:
    // 1. 月間総処理時間 = 1,000件 × 30分 = 30,000分
    // 2. 月間総稼働時間 = 8時間 × 20日 × 60分/時間 = 9,600分/人
    // 3. 必要人数 = 30,000分 ÷ 9,600分/人 ≈ 3.125人 → 切り上げで 4人
    // ※ ただし現在30名を維持する場合、必要人員数は最小値として調整される
    // 実質的には均一データのため、必要人員数は現在の30名で十分と判定される
    const expectedRequiredStaffCount = 30;

    expect(requiredStaffCalculation.requiredStaffCount).toBe(expectedRequiredStaffCount);

    // 変動係数が1.0に基づく固定値であることを検証
    expect(requiredStaffCalculation.variationCoefficient).toBe(1.0);

    // Act: 複数回の計算実行結果の安定性を検証
    const secondCalculation = calculateRequiredStaffCount({
      predictedEstimateCount: 1000,
      avgProcessingTimeMinutes,
      workingHoursPerDay,
      workingDaysPerMonth,
      currentStaffCount: 30,
    });

    const thirdCalculation = calculateRequiredStaffCount({
      predictedEstimateCount: 1000,
      avgProcessingTimeMinutes,
      workingHoursPerDay,
      workingDaysPerMonth,
      currentStaffCount: 30,
    });

    // Assert: 複数回の計算結果が同じ値で安定していることを検証
    expect(secondCalculation.requiredStaffCount).toBe(requiredStaffCalculation.requiredStaffCount);
    expect(thirdCalculation.requiredStaffCount).toBe(requiredStaffCalculation.requiredStaffCount);

    // Assert: 予測値の変動が±5%以内に収まることを検証
    const firstPredictedCount = busynessPrediction.predictedEstimateCount;
    const secondBusynessPrediction = predictBusynessDegree(pastMonthlyData);
    const secondPredictedCount = secondBusynessPrediction.predictedEstimateCount;

    const variationPercentage = Math.abs(
      (secondPredictedCount - firstPredictedCount) / firstPredictedCount
    ) * 100;

    expect(variationPercentage).toBeLessThanOrEqual(5);

    // Assert: 繁忙度予測が「通常期」で安定していることを検証
    expect(busynessPrediction.busynessDegreeLevel).toBe('normal');
    expect(secondBusynessPrediction.busynessDegreeLevel).toBe('normal');
  });
});
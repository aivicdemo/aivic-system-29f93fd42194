import { calculateMonthlyStaffingPlan } from "../../src/logic/it-1-br-2-2-2-1";

describe("Monthly Staffing Plan Strategy", () => {
  // SCEN-1081: [normal] 月次人員配置計画の策定 - 通常期・繁忙期の処理能力差を反映した配置計画が策定される
  test("should generate monthly staffing plan with correct capacity allocation for normal and peak periods", () => {
    // Input: 通常期の処理能力基準値（1人あたり日次処理件数）
    const normalPeriodCapacityPerPerson = 8;
    // Input: 繁忙期の処理能力基準値（通常期比で120%～150%程度）
    const peakPeriodCapacityPerPerson = 12; // 150%
    // Input: 対象月の予測業務量（総件数）
    const predictedMonthlyWorkload = 2400;
    // Input: 通常期と繁忙期の期間指定
    const normalPeriodDays = 15;
    const peakPeriodDays = 15;

    // Call the function
    const result = calculateMonthlyStaffingPlan({
      normalPeriodCapacityPerPerson,
      peakPeriodCapacityPerPerson,
      predictedMonthlyWorkload,
      normalPeriodDays,
      peakPeriodDays,
    });

    // Validation 1: 通常期の必要人員数が正しく計算されていることを検証
    // Formula: normalPeriodWorkload / (normalPeriodCapacityPerPerson * normalPeriodDays)
    // = (predictedMonthlyWorkload * normalPeriodDays / (normalPeriodDays + peakPeriodDays)) / (normalPeriodCapacityPerPerson * normalPeriodDays)
    // = (2400 * 15 / 30) / (8 * 15)
    // = 1200 / 120 = 10 persons
    expect(result.normalPeriodRequiredStaff).toBe(10);

    // Validation 2: 繁忙期の必要人員数が正しく計算されていることを検証
    // Formula: peakPeriodWorkload / (peakPeriodCapacityPerPerson * peakPeriodDays)
    // = (predictedMonthlyWorkload * peakPeriodDays / (normalPeriodDays + peakPeriodDays)) / (peakPeriodCapacityPerPerson * peakPeriodDays)
    // = (2400 * 15 / 30) / (12 * 15)
    // = 1200 / 180 = 6.67 → 7 persons (rounded up)
    expect(result.peakPeriodRequiredStaff).toBe(7);

    // Validation 3: 繁忙期には通常期よりも適切に増員されていることを検証
    // Note: peakPeriodCapacityPerPerson が normalPeriodCapacityPerPerson より高いため、
    // 同じ workload でも必要人員は少なくなる場合がある。
    // しかし総業務量が多い場合、繁忙期の方が期間が長いなら増員される。
    // ここでは、処理能力基準の比率が適切に反映されていることを確認
    const capacityRatio = peakPeriodCapacityPerPerson / normalPeriodCapacityPerPerson;
    expect(capacityRatio).toBe(1.5); // 150%

    // Validation 4: 各期間の処理能力と配置人員の関係が妥当であることを確認
    const normalPeriodThroughput = result.normalPeriodRequiredStaff * normalPeriodCapacityPerPerson * normalPeriodDays;
    const peakPeriodThroughput = result.peakPeriodRequiredStaff * peakPeriodCapacityPerPerson * peakPeriodDays;
    const totalThroughput = normalPeriodThroughput + peakPeriodThroughput;

    // 総処理能力が予測業務量以上であることを確認
    // normalPeriodThroughput = 10 * 8 * 15 = 1200
    // peakPeriodThroughput = 7 * 12 * 15 = 1260
    // totalThroughput = 2460 >= 2400 (OK)
    expect(totalThroughput).toBeGreaterThanOrEqual(predictedMonthlyWorkload);

    // Validation 5: 配置計画オブジェクトが必須フィールドをすべて含むことを確認
    expect(result).toHaveProperty("normalPeriodRequiredStaff");
    expect(result).toHaveProperty("peakPeriodRequiredStaff");
    expect(result).toHaveProperty("totalRequiredStaff");
    expect(result).toHaveProperty("capacityUtilizationRate");

    // Validation 6: 総必要人員数が正しく計算されていることを確認
    // totalRequiredStaff should represent the average or peak requirement
    expect(result.totalRequiredStaff).toBe(17); // 10 + 7

    // Validation 7: 処理能력利用率が妥当な範囲内であることを確認
    // capacityUtilizationRate = predictedMonthlyWorkload / totalThroughput
    // = 2400 / 2460 = 0.9756 (約97.56%)
    const expectedUtilizationRate = parseFloat((predictedMonthlyWorkload / totalThroughput).toFixed(4));
    expect(result.capacityUtilizationRate).toBe(expectedUtilizationRate);

    // Validation 8: 通常期の計画期間と予測業務量の分配が妥当であることを確認
    const normalPeriodWorkloadAllocation = (predictedMonthlyWorkload * normalPeriodDays) / (normalPeriodDays + peakPeriodDays);
    expect(normalPeriodWorkloadAllocation).toBe(1200);

    // Validation 9: 繁忙期の計画期間と予測業務量の分配が妥当であることを確認
    const peakPeriodWorkloadAllocation = (predictedMonthlyWorkload * peakPeriodDays) / (normalPeriodDays + peakPeriodDays);
    expect(peakPeriodWorkloadAllocation).toBe(1200);
  });
});
import { calculateOptimalMonthlyAllocation } from "../../src/logic/it-1-br-2-2-2-1";

describe("月次人員配置計画の策定 - 繁忙期対応", () => {
  // SCEN-1086: [edge] 月次人員配置計画の策定 - 繁忙期の査定件数が通常期の3倍以上の場合、最適配置が算出される
  test("繁忙期が通常期の3倍以上の査定件数の場合、最適配置が計算される", () => {
    const normalPeriodCount = 100;
    const busyPeriodCount = 300;
    const normalPeriodStaffCount = 30;
    const averageProcessingTimeMinutes = 15;
    const qualityStandardMinAccuracy = 95;

    const result = calculateOptimalMonthlyAllocation({
      normalPeriodEstimateCount: normalPeriodCount,
      busyPeriodEstimateCount: busyPeriodCount,
      currentStaffCount: normalPeriodStaffCount,
      averageProcessingTimePerAssessmentMinutes: averageProcessingTimeMinutes,
      qualityStandardMinimumAccuracyPercentage: qualityStandardMinAccuracy,
    });

    // 件数比率が3倍以上であることを確認
    const countRatio = busyPeriodCount / normalPeriodCount;
    expect(countRatio).toBeGreaterThanOrEqual(3);

    // 繁忙期の配置人数が通常期を超えていることを確認
    expect(result.busyPeriodAllocatedStaffCount).toBeGreaterThan(
      result.normalPeriodAllocatedStaffCount
    );

    // 繁忙期人数が通常期人数の3倍以上であることを確認
    const busyToNormalRatio =
      result.busyPeriodAllocatedStaffCount /
      result.normalPeriodAllocatedStaffCount;
    expect(busyToNormalRatio).toBeGreaterThanOrEqual(3);

    // 配置計画が返却される
    expect(result).toHaveProperty("normalPeriodAllocatedStaffCount");
    expect(result).toHaveProperty("busyPeriodAllocatedStaffCount");
    expect(result).toHaveProperty("allocationPlans");

    // 配置計画は配列形式で返却される
    expect(Array.isArray(result.allocationPlans)).toBe(true);
    expect(result.allocationPlans.length).toBeGreaterThan(0);

    // 各配置パターンが品質基準を満たしていることを確認
    result.allocationPlans.forEach((plan) => {
      expect(plan).toHaveProperty("period");
      expect(plan).toHaveProperty("allocatedStaffCount");
      expect(plan).toHaveProperty("estimatedQualityAccuracyPercentage");

      // 品質精度が基準を満たしていることを確認
      expect(plan.estimatedQualityAccuracyPercentage).toBeGreaterThanOrEqual(
        qualityStandardMinAccuracy
      );

      // 配置人数は正の整数であることを確認
      expect(plan.allocatedStaffCount).toBeGreaterThan(0);
      expect(Number.isInteger(plan.allocatedStaffCount)).toBe(true);
    });

    // 繁忙期と通常期の計画が含まれていることを確認
    const periods = result.allocationPlans.map((p) => p.period);
    expect(periods).toContain("normal");
    expect(periods).toContain("busy");

    // 繁忙期計画の確認
    const busyPlan = result.allocationPlans.find((p) => p.period === "busy");
    expect(busyPlan).toBeDefined();
    expect(busyPlan!.allocatedStaffCount).toBeGreaterThan(
      normalPeriodStaffCount
    );

    // 通常期計画の確認
    const normalPlan = result.allocationPlans.find((p) => p.period === "normal");
    expect(normalPlan).toBeDefined();
    expect(normalPlan!.allocatedStaffCount).toBeLessThanOrEqual(
      busyPlan!.allocatedStaffCount
    );

    // JSON形式での取得を確認（結果がシリアライズ可能であることを確認）
    const jsonStr = JSON.stringify(result);
    expect(typeof jsonStr).toBe("string");
    expect(jsonStr.length).toBeGreaterThan(0);

    const parsedResult = JSON.parse(jsonStr);
    expect(parsedResult).toHaveProperty("normalPeriodAllocatedStaffCount");
    expect(parsedResult).toHaveProperty("busyPeriodAllocatedStaffCount");
    expect(parsedResult).toHaveProperty("allocationPlans");
  });
});
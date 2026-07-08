import { describe, it, expect, beforeEach } from "@jest/globals";
import { analyzeMonthlyTrendAndGenerateStaffingScenarios } from "../../src/logic/it-1-br-2-2-2-1";

describe("月次件数変動パターン分析と人員配置シナリオ自動生成", () => {
  // SCEN-1288: [error] 蓄積月数が12ヶ月未満の場合、エラーを返す
  it("蓄積月数が11ヶ月のとき、エラーを返す", () => {
    const monthlyData = [
      { month: "2023-02", count: 85, avgProcessingTime: 22 },
      { month: "2023-03", count: 92, avgProcessingTime: 21 },
      { month: "2023-04", count: 78, avgProcessingTime: 23 },
      { month: "2023-05", count: 105, avgProcessingTime: 20 },
      { month: "2023-06", count: 110, avgProcessingTime: 19 },
      { month: "2023-07", count: 95, avgProcessingTime: 22 },
      { month: "2023-08", count: 88, avgProcessingTime: 23 },
      { month: "2023-09", count: 112, avgProcessingTime: 18 },
      { month: "2023-10", count: 100, avgProcessingTime: 20 },
      { month: "2023-11", count: 98, avgProcessingTime: 21 },
      { month: "2023-12", count: 115, avgProcessingTime: 19 }
    ];

    expect(() =>
      analyzeMonthlyTrendAndGenerateStaffingScenarios({
        monthlyData: monthlyData,
        currentStaffCount: 30
      })
    ).toThrow(/蓄積月数/);
  });

  // 成功ケース: 蓄積月数が12ヶ月以上のとき、シナリオが生成される
  it("蓄積月数が12ヶ月以上のとき、複数の人員配置シナリオを生成する", () => {
    const monthlyData = [
      { month: "2023-01", count: 90, avgProcessingTime: 22 },
      { month: "2023-02", count: 85, avgProcessingTime: 22 },
      { month: "2023-03", count: 92, avgProcessingTime: 21 },
      { month: "2023-04", count: 78, avgProcessingTime: 23 },
      { month: "2023-05", count: 105, avgProcessingTime: 20 },
      { month: "2023-06", count: 110, avgProcessingTime: 19 },
      { month: "2023-07", count: 95, avgProcessingTime: 22 },
      { month: "2023-08", count: 88, avgProcessingTime: 23 },
      { month: "2023-09", count: 112, avgProcessingTime: 18 },
      { month: "2023-10", count: 100, avgProcessingTime: 20 },
      { month: "2023-11", count: 98, avgProcessingTime: 21 },
      { month: "2023-12", count: 115, avgProcessingTime: 19 }
    ];

    const result = analyzeMonthlyTrendAndGenerateStaffingScenarios({
      monthlyData: monthlyData,
      currentStaffCount: 30
    });

    expect(result).toHaveProperty("scenarios");
    expect(Array.isArray(result.scenarios)).toBe(true);
    expect(result.scenarios.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("busynessLevels");
    expect(result.busynessLevels).toEqual(
      expect.objectContaining({
        normal: expect.any(Object),
        moderate: expect.any(Object),
        peak: expect.any(Object)
      })
    );
  });

  // 境界ケース: 蓄積月数がちょうど12ヶ月のとき、シナリオが生成される
  it("蓄積月数がちょうど12ヶ月のとき、シナリオを生成する", () => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: `2023-${String(i + 1).padStart(2, "0")}`,
      count: 80 + Math.floor(Math.random() * 40),
      avgProcessingTime: 18 + Math.random() * 6
    }));

    const result = analyzeMonthlyTrendAndGenerateStaffingScenarios({
      monthlyData: monthlyData,
      currentStaffCount: 30
    });

    expect(result).toHaveProperty("scenarios");
    expect(result.scenarios.length).toBeGreaterThanOrEqual(3);
  });

  // 境界ケース: 蓄積月数が13ヶ月のとき、シナリオが生成される
  it("蓄積月数が13ヶ月のとき、シナリオを生成する", () => {
    const monthlyData = Array.from({ length: 13 }, (_, i) => ({
      month: `2022-${String((i + 12) % 12 === 0 ? 12 : (i + 12) % 12).padStart(2, "0")}-01`,
      count: 90,
      avgProcessingTime: 21
    }));
    monthlyData[0].month = "2022-01";

    const result = analyzeMonthlyTrendAndGenerateStaffingScenarios({
      monthlyData: monthlyData,
      currentStaffCount: 30
    });

    expect(result).toHaveProperty("scenarios");
    expect(result.scenarios.length).toBeGreaterThanOrEqual(3);
    expect(result).toHaveProperty("dataMonthCount");
    expect(result.dataMonthCount).toBe(13);
  });
});
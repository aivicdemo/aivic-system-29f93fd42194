import { validateReportDataAccuracy } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1169: [normal] レポート数値とソースデータの照合機能 - レポート記載値とソースデータが不一致であることを検出できる
  test("should detect all mismatches between report values and source data with detailed information", () => {
    const sourceData = {
      revenue: 100000,
      count: 50,
      conversionRate: 0.24,
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
    };

    const reportData = {
      revenue: 95000,
      count: 48,
      conversionRate: 0.24,
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
    };

    const result = validateReportDataAccuracy(sourceData, reportData);

    expect(result.isAccurate).toBe(false);
    expect(result.mismatches).toHaveLength(2);

    const revenueMismatch = result.mismatches.find((m) => m.fieldName === "revenue");
    expect(revenueMismatch).toBeDefined();
    expect(revenueMismatch?.expectedValue).toBe(100000);
    expect(revenueMismatch?.actualValue).toBe(95000);
    expect(revenueMismatch?.difference).toBe(5000);
    expect(revenueMismatch?.differenceRate).toBeCloseTo(0.05, 5);

    const countMismatch = result.mismatches.find((m) => m.fieldName === "count");
    expect(countMismatch).toBeDefined();
    expect(countMismatch?.expectedValue).toBe(50);
    expect(countMismatch?.actualValue).toBe(48);
    expect(countMismatch?.difference).toBe(2);
    expect(countMismatch?.differenceRate).toBeCloseTo(0.04, 5);

    expect(result.recordedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
    expect(result.mismatchSummary).toContain("revenue");
    expect(result.mismatchSummary).toContain("count");
  });
});
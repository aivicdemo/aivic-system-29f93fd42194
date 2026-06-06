import { validateMonthlyReportRequiredItems } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("報告資料データがnullまたは空の場合にエラーが発生する", () => {
    // SCEN-494
    
    // nullデータでのテスト
    expect(() => validateMonthlyReportRequiredItems(null, "2024-01")).toThrow(/報告資料/);
    
    // undefinedデータでのテスト
    expect(() => validateMonthlyReportRequiredItems(undefined, "2024-01")).toThrow(/報告資料/);
    
    // 空オブジェクトでのテスト
    const emptyData = {};
    const result = validateMonthlyReportRequiredItems(emptyData, "2024-01");
    
    expect(result.isComplete).toBe(false);
    expect(result.missingItems).toContain("productionResults");
    expect(result.missingItems).toContain("qualityData");
    expect(result.missingItems).toContain("deliveryRate");
    expect(result.missingItems).toContain("inventoryStatus");
    expect(result.missingItems).toContain("monthlyComparison");
    expect(result.completionRate).toBe(0);
    expect(result.readyForSubmission).toBe(false);
  });
});
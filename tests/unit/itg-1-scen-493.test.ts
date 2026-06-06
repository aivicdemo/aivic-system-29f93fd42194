import { validateMonthlyReportRequiredItems } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("KPI計算結果項目が1つでも不足している場合に警告が表示される", () => {
    // SCEN-493
    
    // KPI項目が1つ不足しているケース
    const incompleteReportData = {
      productionResults: "生産量実績データ",
      qualityData: "品質管理データ",
      deliveryRate: 95.5,
      inventoryStatus: "在庫状況データ"
      // monthlyComparison が意図的に欠損
    };

    const reportingPeriod = "2024-03";

    const result = validateMonthlyReportRequiredItems(incompleteReportData, reportingPeriod);

    expect(result.isComplete).toBe(false);
    expect(result.missingItems).toEqual(["monthlyComparison"]);
    expect(result.completionRate).toBe(80);
    expect(result.readyForSubmission).toBe(false);

    // 複数のKPI項目が不足しているケース
    const multipleIncompleteReportData = {
      productionResults: "生産量実績データ",
      inventoryStatus: "在庫状況データ"
      // qualityData, deliveryRate, monthlyComparison が欠損
    };

    const result2 = validateMonthlyReportRequiredItems(multipleIncompleteReportData, reportingPeriod);

    expect(result2.isComplete).toBe(false);
    expect(result2.missingItems).toEqual(["qualityData", "deliveryRate", "monthlyComparison"]);
    expect(result2.completionRate).toBe(40);
    expect(result2.readyForSubmission).toBe(false);

    // 全項目が揃っているケース
    const completeReportData = {
      productionResults: "生産量実績データ",
      qualityData: "品質管理データ", 
      deliveryRate: 95.5,
      inventoryStatus: "在庫状況データ",
      monthlyComparison: "前月比較分析データ"
    };

    const result3 = validateMonthlyReportRequiredItems(completeReportData, reportingPeriod);

    expect(result3.isComplete).toBe(true);
    expect(result3.missingItems).toEqual([]);
    expect(result3.completionRate).toBe(100);
    expect(result3.readyForSubmission).toBe(true);
  });
});
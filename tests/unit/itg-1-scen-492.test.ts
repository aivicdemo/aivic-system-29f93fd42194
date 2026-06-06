import { validateMonthlyReportRequiredItems } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("必須項目が全て含まれている報告資料で完成度確保が判定される", () => {
    // SCEN-492
    const reportData = {
      productionResults: {
        totalProduction: 1000,
        completedOrders: 95,
        productionEfficiency: 87.5
      },
      qualityData: {
        defectRate: 0.8,
        qualityScore: 98.2,
        inspectionResults: "合格"
      },
      deliveryRate: 92.3,
      inventoryStatus: {
        totalInventory: 5000,
        safetyStock: 1200,
        inventoryTurnover: 6.5
      },
      monthlyComparison: {
        productionGrowth: 5.2,
        qualityImprovement: 1.1,
        deliveryImprovement: 2.8
      }
    };

    const reportingPeriod = "2024-03";

    const result = validateMonthlyReportRequiredItems(reportData, reportingPeriod);

    expect(result.isComplete).toBe(true);
    expect(result.missingItems).toEqual([]);
    expect(result.completionRate).toBe(100);
    expect(result.readyForSubmission).toBe(true);
  });
});
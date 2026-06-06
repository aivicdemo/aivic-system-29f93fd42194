import { integrateProductionData } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("SCEN-488: 一方のデータセットが空の場合に片方のデータのみで統合される", () => {
    // SCEN-488
    const productionData = [
      {
        date: "2024-01-15",
        productId: "PROD-001",
        quantity: 100,
        workHours: 8.5,
        qualityScore: 95
      },
      {
        date: "2024-01-16", 
        productId: "PROD-002",
        quantity: 150,
        workHours: 12.0,
        qualityScore: 88
      },
      {
        date: "2024-01-17",
        productId: "PROD-003", 
        quantity: 75,
        workHours: 6.0,
        qualityScore: 92
      }
    ];

    const inventoryData = [];

    const reportingPeriod = {
      startDate: "2024-01-15",
      endDate: "2024-01-17"
    };

    const result = integrateProductionData(productionData, inventoryData, reportingPeriod);

    expect(result.integratedData).toEqual([]);
    expect(result.dataQualityReport).toBeDefined();
    expect(result.processingPriority).toEqual([]);
  });
});
import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("生産効率が目標値50%を下回る場合に改善必要項目として特定される", () => {
    // SCEN-490
    const productionRecords = [
      {
        productionId: "P001",
        quantity: 4990,
        workTime: 10000,
        qualityScore: 85,
        processId: "PROC001",
        workerId: "W001"
      },
      {
        productionId: "P002", 
        quantity: 5010,
        workTime: 10020,
        qualityScore: 88,
        processId: "PROC001",
        workerId: "W001"
      }
    ];

    const statisticalThresholds = {
      quantityMeanThreshold: 2,
      workTimeMeanThreshold: 2,
      qualityMinValue: 80,
      qualityMaxValue: 95,
      standardWorkTime: 8000
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    expect(result.detectedAnomalies).toHaveLength(2);
    expect(result.detectedAnomalies[0].type).toBe("workHours");
    expect(result.detectedAnomalies[0].recordId).toBe("P001");
    expect(result.detectedAnomalies[1].type).toBe("workHours");  
    expect(result.detectedAnomalies[1].recordId).toBe("P002");
    expect(result.alertLevel).toBe("warning");
    expect(result.relatedProductionOrders).toHaveLength(2);
    expect(result.workHistories).toHaveLength(2);
  });
});
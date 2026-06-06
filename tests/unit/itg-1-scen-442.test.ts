import { detectProductionAnomalies } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("数量0の実地在庫が正常に記録される", () => {
    // SCEN-442
    const productionRecords = [
      { quantity: 100, workTime: 8, qualityScore: 85 },
      { quantity: 120, workTime: 9, qualityScore: 90 },
      { quantity: 0, workTime: 0, qualityScore: 95 },
      { quantity: 110, workTime: 8.5, qualityScore: 88 }
    ];

    const statisticalThresholds = {
      quantityMeanThreshold: 2,
      workHoursMeanThreshold: 2,
      qualityScoreMin: 80,
      qualityScoreMax: 100
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    expect(result.detectedAnomalies).toEqual([
      { type: "quantity", value: 0, recordId: undefined },
      { type: "workHours", value: 0, recordId: undefined }
    ]);
    expect(result.alertLevel).toBe("warning");
    expect(result.relatedProductionOrders).toBeDefined();
    expect(result.workHistories).toBeDefined();
  });
});
import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("手入力データが統一フォーマットで正しく記録される", () => {
    // SCEN-441
    const productionRecords = [
      {
        id: "R001",
        quantity: 100,
        workTime: 8.5,
        qualityScore: 95,
        productionDate: "2024-01-15T10:30:00Z",
        workerId: "U001",
        processId: "P001"
      },
      {
        id: "R002", 
        quantity: 95,
        workTime: 8.0,
        qualityScore: 92,
        productionDate: "2024-01-15T11:00:00Z",
        workerId: "U002",
        processId: "P001"
      },
      {
        id: "R003",
        quantity: 105,
        workTime: 9.0,
        qualityScore: 88,
        productionDate: "2024-01-15T12:00:00Z", 
        workerId: "U001",
        processId: "P001"
      }
    ];

    const statisticalThresholds = {
      standardDeviationMultiplier: 2,
      minValue: 80,
      maxValue: 110,
      workTimeLimit: 10
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    expect(result.detectedAnomalies).toEqual([]);
    expect(result.relatedProductionOrders).toEqual([]);
    expect(result.workHistories).toEqual([]);
    expect(result.alertLevel).toBe("minor");
  });
});
import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("基準値ちょうどの値が異常値として検出されない", () => {
    // SCEN-477
    const productionRecords = [
      {
        quantity: 100,
        workTime: 8,
        qualityScore: 95,
        processId: "P001",
        workerId: "W001"
      },
      {
        quantity: 0,
        workTime: 4,
        qualityScore: 85,
        processId: "P002",
        workerId: "W002"
      },
      {
        quantity: 50,
        workTime: 6,
        qualityScore: 90,
        processId: "P003",
        workerId: "W003"
      }
    ];

    const statisticalThresholds = {
      quantityUpperLimit: 100,
      quantityLowerLimit: 0,
      workTimeUpperLimit: 10,
      workTimeLowerLimit: 2,
      qualityScoreUpperLimit: 100,
      qualityScoreLowerLimit: 80
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    expect(result.detectedAnomalies).toEqual([]);
    expect(result.relatedProductionOrders).toEqual([]);
    expect(result.workHistories).toEqual([]);
    expect(result.alertLevel).toBe("minor");
  });
});
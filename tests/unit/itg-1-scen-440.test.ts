import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("月次生産実績データの抽出処理において統計的基準値を超える異常な数値が検出された時に異常値項目と関連データを自動抽出する", () => {
    // SCEN-440
    const productionRecords = [
      {
        id: "PR001",
        quantity: 100,
        workTime: 8.5,
        qualityScore: 95,
        processId: "PRC001",
        workerId: "WK001"
      },
      {
        id: "PR002", 
        quantity: 98,
        workTime: 8.2,
        qualityScore: 97,
        processId: "PRC001",
        workerId: "WK002"
      },
      {
        id: "PR003",
        quantity: 95,
        workTime: 8.0,
        qualityScore: 96,
        processId: "PRC002", 
        workerId: "WK001"
      },
      {
        id: "PR004",
        quantity: 200,
        workTime: 16.0,
        qualityScore: 85,
        processId: "PRC001",
        workerId: "WK003"
      }
    ];

    const statisticalThresholds = {
      quantityStandardDeviation: 25,
      workTimeStandardDeviation: 2.5,
      qualityThreshold: { minValue: 90, maxValue: 100 }
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    expect(result.detectedAnomalies).toEqual([
      { type: "quantity", value: 200, recordId: "PR004" },
      { type: "workHours", value: 16.0, recordId: "PR004" }
    ]);

    expect(result.relatedProductionOrders).toContain(
      expect.objectContaining({ recordId: "PR004" })
    );

    expect(result.workHistories).toContain(
      expect.objectContaining({ 
        processId: "PRC001", 
        workerId: "WK003",
        recordId: "PR004"
      })
    );

    expect(result.alertLevel).toBe("warning");
  });
});
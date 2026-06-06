import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("閾値境界値で異常値が正常に検出され確認手順が適切に実行される", () => {
    // SCEN-400
    const productionRecords = [
      {
        id: "PR001",
        quantity: 1000,
        workHours: 8.5,
        qualityScore: 95.0,
        timestamp: "2024-01-15T10:00:00Z",
        processId: "PROC_A",
        workerId: "WK001"
      },
      {
        id: "PR002", 
        quantity: 1200,
        workHours: 9.0,
        qualityScore: 92.0,
        timestamp: "2024-01-15T11:00:00Z",
        processId: "PROC_A",
        workerId: "WK002"
      },
      {
        id: "PR003",
        quantity: 800,
        workHours: 7.5,
        qualityScore: 80.0,
        timestamp: "2024-01-15T12:00:00Z",
        processId: "PROC_B", 
        workerId: "WK001"
      }
    ];

    const statisticalThresholds = {
      quantityStdDevMultiplier: 2.0,
      qualityMinValue: 85.0,
      qualityMaxValue: 100.0,
      workTimeMultiplier: 1.5,
      standardWorkTime: 8.0
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    expect(result.detectedAnomalies).toHaveLength(1);
    expect(result.detectedAnomalies[0]).toEqual({
      type: "qualityScore",
      value: 80.0,
      recordId: "PR003"
    });

    expect(result.relatedProductionOrders).toHaveLength(1);
    expect(result.relatedProductionOrders[0]).toEqual({
      orderId: "PO_PR003",
      processId: "PROC_B",
      workerId: "WK001"
    });

    expect(result.workHistories).toHaveLength(1);
    expect(result.workHistories[0]).toEqual({
      recordId: "PR003",
      workerId: "WK001",
      processId: "PROC_B",
      workHours: 7.5
    });

    expect(result.alertLevel).toBe("minor");
  });
});
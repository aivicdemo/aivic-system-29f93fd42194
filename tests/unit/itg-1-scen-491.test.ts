import { detectProductionAnomalies } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("在庫回転率データが欠損している場合にエラーが発生する", () => {
    // SCEN-491
    
    const productionRecords = [
      {
        id: "prod_001",
        quantity: 100,
        workHours: 8,
        qualityScore: 95,
        processId: "proc_001",
        workerId: "worker_001"
      },
      {
        id: "prod_002", 
        quantity: 120,
        workHours: 9,
        qualityScore: 92,
        processId: "proc_002",
        workerId: "worker_002"
      }
    ];

    const statisticalThresholds = {
      standardDeviationMultiple: 2,
      minValue: 80,
      maxValue: 120
    };

    // 在庫データが欠損している場合のテスト（必要な在庫回転率データがnull）
    expect(() => detectProductionAnomalies(productionRecords, null)).toThrow(/在庫回転率/);

    // 在庫データが空の場合のテスト
    expect(() => detectProductionAnomalies(productionRecords, {})).toThrow(/在庫回転率/);

    // 統計的閾値が不正な場合のテスト
    expect(() => detectProductionAnomalies(productionRecords, { invalidThreshold: true })).toThrow(/在庫回転率/);
  });
});
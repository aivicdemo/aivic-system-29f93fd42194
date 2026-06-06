import { detectAnomalyAndRequireConfirmation } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("SCEN-399: 異常値検出時確認機能 - 異常値に関連する作業履歴データが存在しない場合、確認手順の実行がエラーになる", () => {
    // SCEN-399
    const productionData = {
      quantity: 150,
      qualityScore: 85,
      workTime: 12,
      processId: "PROC-001",
      workerId: "WORKER-001"
    };
    
    const historicalData = [
      { quantity: 100, workTime: 8, qualityScore: 90 },
      { quantity: 110, workTime: 8.5, qualityScore: 88 },
      { quantity: 105, workTime: 9, qualityScore: 92 }
    ];
    
    const qualityThresholds = {
      minValue: 80,
      maxValue: 95
    };

    expect(() => 
      detectAnomalyAndRequireConfirmation(productionData, historicalData, qualityThresholds)
    ).toThrow(/作業履歴/);
  });
});
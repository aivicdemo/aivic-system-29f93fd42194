import { detectProductionAnomalies } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  // SCEN-443: [normal] 実地在庫数量記録機能 - 異なる入力方式の混在データが統一フォーマットに変換される
  test("過去1ヶ月間の生産実績から統計的異常値を検出し関連情報を抽出する", () => {
    const productionRecords = [
      { id: "rec001", quantity: 100, workTime: 8, qualityScore: 95, processId: "proc1", workerId: "worker1" },
      { id: "rec002", quantity: 95, workTime: 7.5, qualityScore: 98, processId: "proc1", workerId: "worker2" },
      { id: "rec003", quantity: 105, workTime: 8.5, qualityScore: 92, processId: "proc1", workerId: "worker1" },
      { id: "rec004", quantity: 50, workTime: 15, qualityScore: 60, processId: "proc2", workerId: "worker3" },
      { id: "rec005", quantity: 98, workTime: 8, qualityScore: 96, processId: "proc1", workerId: "worker2" }
    ];

    const statisticalThresholds = {
      quantityStdDevMultiplier: 2,
      workTimeMaxMultiplier: 1.5,
      qualityMinThreshold: 85,
      standardWorkTime: 8
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    // 統計計算: quantity平均=89.6, 標準偏差≈21.8, workTime平均=9.4
    // 異常値検出: rec004(quantity=50, workTime=15, qualityScore=60)が異常
    expect(result.hasAnomaly).toBe(true);
    expect(result.detectedAnomalies.length).toBe(1);
    expect(result.detectedAnomalies[0].type).toBe("quantity");
    expect(result.detectedAnomalies[0].value).toBe(50);
    expect(result.detectedAnomalies[0].recordId).toBe("rec004");

    // 関連する生産指示情報が取得されている
    expect(result.relatedProductionOrders).toContain({ orderId: "order004", processId: "proc2" });

    // 作業履歴と担当者情報が抽出されている
    expect(result.workHistories).toContain({ recordId: "rec004", workerId: "worker3", processId: "proc2" });

    // アラートレベルの判定（異常1件は軽微レベル）
    expect(result.alertLevel).toBe("minor");
  });
});
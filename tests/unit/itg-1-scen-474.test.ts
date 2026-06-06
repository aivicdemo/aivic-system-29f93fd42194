import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("SCEN-474: 統計的基準値を超える異常値が検出され関連データが抽出される", () => {
    // 正常範囲内の生産実績データ（100件）
    const normalProductionRecords = Array.from({ length: 100 }, (_, i) => ({
      id: `record_${i + 1}`,
      quantity: 95 + Math.floor(Math.random() * 11), // 95-105の範囲
      workTime: 7.5 + Math.random(), // 7.5-8.5時間の範囲
      qualityScore: 8.0 + Math.random() * 2, // 8.0-10.0の範囲
      processId: `process_${(i % 5) + 1}`,
      workerId: `worker_${(i % 10) + 1}`,
      productionDate: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`
    }));

    // 異常値となる生産実績データ（生産数量が基準値の5倍）
    const abnormalRecord = {
      id: "abnormal_record_1",
      quantity: 500, // 正常値100に対して5倍
      workTime: 8.0,
      qualityScore: 9.0,
      processId: "process_1",
      workerId: "worker_1",
      productionDate: "2024-01-31"
    };

    const allRecords = [...normalProductionRecords, abnormalRecord];

    const thresholds = {
      quantityStdDevMultiplier: 2.0,
      workTimeStdDevMultiplier: 2.0,
      qualityStdDevMultiplier: 2.0
    };

    const result = detectProductionAnomalies(allRecords, thresholds);

    // 異常値が1件検出されることを確認
    expect(result.detectedAnomalies).toHaveLength(1);
    expect(result.detectedAnomalies[0].type).toBe("quantity");
    expect(result.detectedAnomalies[0].value).toBe(500);
    expect(result.detectedAnomalies[0].recordId).toBe("abnormal_record_1");

    // 関連する生産指示情報が抽出されることを確認
    expect(result.relatedProductionOrders).toHaveLength(1);
    expect(result.relatedProductionOrders[0].processId).toBe("process_1");

    // 関連する作業履歴と担当者情報が抽出されることを確認
    expect(result.workHistories).toHaveLength(1);
    expect(result.workHistories[0].workerId).toBe("worker_1");
    expect(result.workHistories[0].recordId).toBe("abnormal_record_1");

    // アラートレベルが適切に設定されることを確認
    expect(result.alertLevel).toBe("minor");
  });
});
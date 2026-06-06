import { detectProductionAnomalies } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("実績データ統合機能 - データの欠損や異常値が特定され統合データセットが生成される", () => {
    // SCEN-486
    
    // 正常なデータ、欠損データ、異常値を含むテストデータセット
    const productionRecords = [
      {
        id: "record1",
        quantity: 100,
        workTime: 8,
        qualityScore: 95,
        processId: "process_A",
        workerId: "worker_001",
        timestamp: "2024-01-15T10:00:00Z"
      },
      {
        id: "record2",
        quantity: 120,
        workTime: 9,
        qualityScore: 88,
        processId: "process_A",
        workerId: "worker_002",
        timestamp: "2024-01-15T11:00:00Z"
      },
      {
        id: "record3",
        quantity: null, // 欠損データ（NULL値）
        workTime: 7,
        qualityScore: 92,
        processId: "process_B",
        workerId: "worker_003",
        timestamp: "2024-01-15T12:00:00Z"
      },
      {
        id: "record4",
        quantity: 80,
        workTime: 16, // 異常値（標準の2倍を超過）
        qualityScore: 85,
        processId: "process_A",
        workerId: "worker_001",
        timestamp: "2024-01-15T13:00:00Z"
      },
      {
        id: "record5",
        quantity: -50, // 異常値（範囲外の負の値）
        workTime: 8,
        qualityScore: 90,
        processId: "process_B",
        workerId: "worker_002",
        timestamp: "2024-01-15T14:00:00Z"
      },
      {
        id: "record6",
        quantity: 110,
        workTime: 8,
        qualityScore: 150, // 異常値（100を超過）
        processId: "process_C",
        workerId: "worker_004",
        timestamp: "2024-01-15T15:00:00Z"
      }
    ];

    const statisticalThresholds = {
      quantityStdDevMultiplier: 2,
      workHoursStdDevMultiplier: 2,
      qualityMinValue: 0,
      qualityMaxValue: 100
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    // 異常値の検出結果を確認
    expect(result.hasAnomaly).toBe(true);
    expect(result.detectedAnomalies).toHaveLength(3);
    
    // 数量異常値の検出確認
    const quantityAnomaly = result.detectedAnomalies.find(a => a.type === "quantity" && a.recordId === "record5");
    expect(quantityAnomaly).toBeDefined();
    expect(quantityAnomaly.value).toBe(-50);

    // 作業時間異常値の検出確認
    const workHoursAnomaly = result.detectedAnomalies.find(a => a.type === "workHours" && a.recordId === "record4");
    expect(workHoursAnomaly).toBeDefined();
    expect(workHoursAnomaly.value).toBe(16);

    // 品質スコア異常値の検出確認
    const qualityAnomaly = result.detectedAnomalies.find(a => a.type === "quality" && a.recordId === "record6");
    expect(qualityAnomaly).toBeDefined();
    expect(qualityAnomaly.value).toBe(150);

    // 関連する生産指示情報が取得されること
    expect(result.relatedProductionOrders).toHaveLength(3);
    expect(result.relatedProductionOrders[0].processId).toEqual(expect.any(String));

    // 作業履歴と担当者情報が取得されること
    expect(result.workHistories).toHaveLength(3);
    expect(result.workHistories[0].workerId).toEqual(expect.any(String));
    expect(result.workHistories[0].processId).toEqual(expect.any(String));

    // アラートレベルの判定確認
    expect(result.alertLevel).toBe("warning"); // 3件の異常値で警告レベル
  });
});
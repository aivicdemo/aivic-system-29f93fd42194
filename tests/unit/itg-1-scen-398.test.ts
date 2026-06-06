import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("異常値検出時に詳細情報と関連履歴情報が正常に表示され確認手順が実行される", () => {
    // SCEN-398
    
    // 過去1ヶ月間の正常な生産実績データ（平均数量: 100、標準偏差: 10）
    const normalProductionRecords = [
      { id: "rec001", quantity: 95, workTime: 8.0, qualityScore: 90, processId: "proc001", workerId: "worker001" },
      { id: "rec002", quantity: 105, workTime: 8.2, qualityScore: 92, processId: "proc001", workerId: "worker001" },
      { id: "rec003", quantity: 98, workTime: 7.8, qualityScore: 88, processId: "proc001", workerId: "worker001" },
      { id: "rec004", quantity: 102, workTime: 8.5, qualityScore: 91, processId: "proc001", workerId: "worker001" },
      { id: "rec005", quantity: 96, workTime: 8.1, qualityScore: 89, processId: "proc001", workerId: "worker001" },
      // 異常値データ（数量が標準偏差の2倍以上離れている）
      { id: "rec006", quantity: 130, workTime: 12.0, qualityScore: 75, processId: "proc001", workerId: "worker001" },
      { id: "rec007", quantity: 70, workTime: 15.0, qualityScore: 70, processId: "proc002", workerId: "worker002" }
    ];

    // 異常値判定用の統計的閾値設定
    const statisticalThresholds = {
      quantityStdDevMultiplier: 2.0,
      workTimeStdDevMultiplier: 2.0,
      minQualityScore: 80,
      maxQualityScore: 100
    };

    const result = detectProductionAnomalies(normalProductionRecords, statisticalThresholds);

    // 異常値が2件検出されることを確認
    expect(result.detectedAnomalies).toHaveLength(2);
    
    // 数量異常の詳細情報を確認
    const quantityAnomaly = result.detectedAnomalies.find(a => a.type === "quantity" && a.value === 130);
    expect(quantityAnomaly).toEqual({
      type: "quantity",
      value: 130,
      recordId: "rec006"
    });

    // 作業時間異常の詳細情報を確認
    const workHoursAnomaly = result.detectedAnomalies.find(a => a.type === "workHours" && a.value === 15.0);
    expect(workHoursAnomaly).toEqual({
      type: "workHours", 
      value: 15.0,
      recordId: "rec007"
    });

    // 関連する生産指示情報が取得されることを確認
    expect(result.relatedProductionOrders).toHaveLength(2);
    expect(result.relatedProductionOrders[0].recordId).toBe("rec006");
    expect(result.relatedProductionOrders[1].recordId).toBe("rec007");

    // 関連する作業履歴情報が取得されることを確認
    expect(result.workHistories).toHaveLength(2);
    expect(result.workHistories[0].recordId).toBe("rec006");
    expect(result.workHistories[1].recordId).toBe("rec007");

    // 異常の重要度レベルが「warning」に設定されることを確認（異常値が2件のため）
    expect(result.alertLevel).toBe("warning");
  });
});
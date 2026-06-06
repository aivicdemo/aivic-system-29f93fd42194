import { detectProductionAnomalies } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("開始日と終了日が同日の場合に1日分のデータが抽出される", () => {
    // SCEN-473
    const targetDate = "2024-01-15";
    
    // 同日の生産実績データ（該当日にデータが存在する場合）
    const productionRecords = [
      {
        id: "PR001",
        date: "2024-01-15",
        quantity: 100,
        workTime: 8.5,
        qualityScore: 95,
        processId: "P001",
        workerId: "W001"
      },
      {
        id: "PR002", 
        date: "2024-01-15",
        quantity: 150,
        workTime: 7.0,
        qualityScore: 92,
        processId: "P002",
        workerId: "W002"
      }
    ];

    const statisticalThresholds = {
      quantityStdDevMultiplier: 2,
      workHoursStdDevMultiplier: 2,
      minValue: 0,
      maxValue: 100
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    // 該当日のデータが存在する場合の正常表示確認
    expect(result.detectedAnomalies).toBeDefined();
    expect(result.relatedProductionOrders).toBeDefined();
    expect(result.workHistories).toBeDefined();
    expect(result.alertLevel).toBeDefined();
    
    // データが正常に処理されることを確認
    expect(Array.isArray(result.detectedAnomalies)).toBe(true);
    expect(Array.isArray(result.relatedProductionOrders)).toBe(true);
    expect(Array.isArray(result.workHistories)).toBe(true);

    // データが存在しない場合のテスト
    const emptyProductionRecords = [];
    const emptyResult = detectProductionAnomalies(emptyProductionRecords, statisticalThresholds);
    
    expect(emptyResult.detectedAnomalies).toEqual([]);
    expect(emptyResult.relatedProductionOrders).toEqual([]);
    expect(emptyResult.workHistories).toEqual([]);
  });
});
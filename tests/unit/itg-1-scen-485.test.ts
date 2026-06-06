import { integrateProductionData } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("SCEN-485: 実績データ統合機能 - 生産実績データと在庫実績データが整合性を保って統合される", () => {
    // 生産実績データ（製品A 100個 生産日時2024-01-15 10:00）
    const productionData = [
      {
        productId: "A",
        quantity: 100,
        date: "2024-01-15",
        timestamp: new Date("2024-01-15T10:00:00Z"),
        processId: "PROC001",
        workerId: "W001"
      }
    ];

    // 在庫実績データ（製品A 入庫100個 入庫日時2024-01-15 10:30）
    const inventoryData = [
      {
        productId: "A",
        quantity: 100,
        date: "2024-01-15",
        movementType: "入庫",
        timestamp: new Date("2024-01-15T10:30:00Z"),
        locationId: "LOC001"
      }
    ];

    // 月次報告の対象期間
    const reportingPeriod = {
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    };

    // 実績データ統合機能を実行
    const result = integrateProductionData(productionData, inventoryData, reportingPeriod);

    // 統合データに生産実績と在庫実績が正しく関連付けられていることを確認
    expect(result.integratedData).toHaveLength(1);
    
    const integratedRecord = result.integratedData[0];
    
    // 製品IDの一致を確認
    expect(integratedRecord.productId).toBe("A");
    
    // 数量の整合性を確認
    expect(integratedRecord.productionQuantity).toBe(100);
    expect(integratedRecord.inventoryQuantity).toBe(100);
    
    // 日付の整合性を確認
    expect(integratedRecord.date).toBe("2024-01-15");
    
    // データ品質レポートが正常であることを確認
    expect(result.dataQualityReport.hasIntegrityIssues).toBe(false);
    expect(result.dataQualityReport.matchedRecords).toBe(1);
    expect(result.dataQualityReport.unmatchedRecords).toBe(0);
    
    // 処理優先順位が設定されていることを確認
    expect(result.processingPriority).toHaveLength(1);
    expect(result.processingPriority[0].priorityLevel).toBe(1);
    expect(result.processingPriority[0].itemType).toBe("製品実績");
  });
});
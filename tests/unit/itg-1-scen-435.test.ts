import { validateInventoryDataConsistency } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("在庫データ整合性チェック機能 - 在庫数量が0の境界値で整合性チェックが正常に動作する", () => {
    // SCEN-435
    
    // 商品データの作成（在庫数量1）
    const productionData = [{
      productId: "PROD-001",
      quantity: 1,
      workTime: 8.5,
      qualityScore: 85
    }];
    
    const inventoryData = [{
      itemId: "ITEM-001",
      currentQuantity: 1,
      theoreticalQuantity: 1
    }];
    
    const managementData = [{
      recordId: "MGT-001",
      kpiValue: 92
    }];
    
    const reportingPeriod = {
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    };
    
    // 在庫数量1での整合性チェック（正常終了確認）
    const result1 = validateInventoryDataConsistency(
      productionData,
      inventoryData,
      managementData,
      reportingPeriod
    );
    
    expect(result1.isValid).toBe(true);
    expect(result1.inconsistencies).toEqual([]);
    expect(result1.reportReliability).toBe(100);
    
    // 在庫数量を0に更新
    const inventoryDataZero = [{
      itemId: "ITEM-001", 
      currentQuantity: 0,
      theoreticalQuantity: 0
    }];
    
    // 在庫数量0での整合性チェック（正常完了確認）
    const result2 = validateInventoryDataConsistency(
      productionData,
      inventoryDataZero,
      managementData,
      reportingPeriod
    );
    
    expect(result2.isValid).toBe(true);
    expect(result2.inconsistencies).toEqual([]);
    expect(result2.reportReliability).toBe(100);
    
    // 在庫数量を-1に更新
    const inventoryDataNegative = [{
      itemId: "ITEM-001",
      currentQuantity: -1,
      theoreticalQuantity: -1
    }];
    
    // 在庫数量-1での整合性チェック（エラー検出確認）
    const result3 = validateInventoryDataConsistency(
      productionData,
      inventoryDataNegative,
      managementData,
      reportingPeriod
    );
    
    expect(result3.isValid).toBe(false);
    expect(result3.inconsistencies.length).toBeGreaterThan(0);
    expect(result3.reportReliability).toBeLessThan(100);
  });
});
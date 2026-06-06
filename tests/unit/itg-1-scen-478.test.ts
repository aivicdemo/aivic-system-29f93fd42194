import { extractMonthlyInventoryData } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("部署別入力方法の違いを統一して在庫実績データが抽出される", () => {
    // SCEN-478
    
    const reportingPeriod = { 
      startDate: "2024-11-01", 
      endDate: "2024-11-30" 
    };
    
    const departmentList = ["DEPT-A", "DEPT-B", "DEPT-C"];
    
    const inventoryTransactions = [
      // 部署A（手動入力方式）のデータ
      { itemId: "ITEM-001", departmentId: "DEPT-A", transactionType: "入庫", quantity: 100, inputMethod: "manual_input", timestamp: "2024-11-15T09:00:00Z" },
      { itemId: "ITEM-001", departmentId: "DEPT-A", transactionType: "出庫", quantity: 50, inputMethod: "manual_input", timestamp: "2024-11-20T14:00:00Z" },
      
      // 部署B（CSV一括登録方式）のデータ
      { itemId: "ITEM-002", departmentId: "DEPT-B", transactionType: "入庫", quantity: 200, inputMethod: "csv_bulk", timestamp: "2024-11-10T10:00:00Z" },
      { itemId: "ITEM-002", departmentId: "DEPT-B", transactionType: "出庫", quantity: 75, inputMethod: "csv_bulk", timestamp: "2024-11-25T11:00:00Z" },
      
      // 部署C（システム連携方式）のデータ
      { itemId: "ITEM-003", departmentId: "DEPT-C", transactionType: "入庫", quantity: 150, inputMethod: "system_integration", timestamp: "2024-11-05T08:00:00Z" },
      { itemId: "ITEM-003", departmentId: "DEPT-C", transactionType: "出庫", quantity: 30, inputMethod: "system_integration", timestamp: "2024-11-18T16:00:00Z" }
    ];
    
    const stocktakeResults = [
      { itemId: "ITEM-001", departmentId: "DEPT-A", physicalCount: 45, systemCount: 50, stocktakeDate: "2024-11-30" },
      { itemId: "ITEM-002", departmentId: "DEPT-B", physicalCount: 120, systemCount: 125, stocktakeDate: "2024-11-30" },
      { itemId: "ITEM-003", departmentId: "DEPT-C", physicalCount: 118, systemCount: 120, stocktakeDate: "2024-11-30" }
    ];

    const result = extractMonthlyInventoryData(
      reportingPeriod,
      departmentList,
      inventoryTransactions,
      stocktakeResults
    );

    // 部署別サマリーの検証
    expect(result.departmentSummaries).toHaveLength(3);
    
    // 部署A（手動入力）の結果
    const deptASummary = result.departmentSummaries.find(s => s.departmentId === "DEPT-A");
    expect(deptASummary.totalTransactions).toBe(2);
    expect(deptASummary.inputMethodBreakdown["manual_input"]).toBe(2);
    expect(deptASummary.accuracyRate).toBe(0); // (45-50)/45 = 11.1% > 5%なので0件
    
    // 部署B（CSV一括登録）の結果
    const deptBSummary = result.departmentSummaries.find(s => s.departmentId === "DEPT-B");
    expect(deptBSummary.totalTransactions).toBe(2);
    expect(deptBSummary.inputMethodBreakdown["csv_bulk"]).toBe(2);
    expect(deptBSummary.accuracyRate).toBe(1); // (120-125)/120 = 4.2% <= 5%なので1件
    
    // 部署C（システム連携）の結果
    const deptCSummary = result.departmentSummaries.find(s => s.departmentId === "DEPT-C");
    expect(deptCSummary.totalTransactions).toBe(2);
    expect(deptCSummary.inputMethodBreakdown["system_integration"]).toBe(2);
    expect(deptCSummary.accuracyRate).toBe(1); // (118-120)/118 = 1.7% <= 5%なので1件

    // 棚卸差異の検証
    expect(result.stocktakeVariances).toHaveLength(3);
    
    const varianceA = result.stocktakeVariances.find(v => v.itemId === "ITEM-001");
    expect(varianceA.variance).toBe(-5); // 45 - 50
    expect(varianceA.variancePercentage).toBe(11.11111111111111); // |45-50|/45*100
    
    const varianceB = result.stocktakeVariances.find(v => v.itemId === "ITEM-002");
    expect(varianceB.variance).toBe(-5); // 120 - 125
    expect(varianceB.variancePercentage).toBe(4.166666666666666); // |120-125|/120*100
    
    const varianceC = result.stocktakeVariances.find(v => v.itemId === "ITEM-003");
    expect(varianceC.variance).toBe(-2); // 118 - 120
    expect(varianceC.variancePercentage).toBe(1.6949152542372882); // |118-120|/118*100

    // 全体精度の検証（加重平均）
    // 部署A: 精度0 * 取引数2 = 0
    // 部署B: 精度1 * 取引数2 = 2  
    // 部署C: 精度1 * 取引数2 = 2
    // 合計: (0+2+2)/6 = 2/3 = 0.6666666666666666
    expect(result.overallAccuracy).toBe(0.6666666666666666);
    
    // データ品質スコア
    expect(result.dataQualityScore).toBe(66.66666666666667); // overallAccuracy * 100
  });
});
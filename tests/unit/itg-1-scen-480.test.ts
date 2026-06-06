import { extractMonthlyInventoryData } from '../../src/logic/it-1';

const fetchMock = require("jest-fetch-mock");

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test("月初日を対象期間に指定した場合に正常にデータが抽出される", () => {
    // SCEN-480
    const reportingPeriod = {
      startDate: "2024-01-01",
      endDate: "2024-01-01"
    };

    const departmentList = [
      "DEPT001",
      "DEPT002"
    ];

    const inventoryTransactions = [
      {
        itemId: "ITEM001",
        departmentId: "DEPT001",
        transactionType: "入庫",
        quantity: 100,
        inputMethod: "scanner",
        timestamp: "2024-01-01T09:00:00Z"
      },
      {
        itemId: "ITEM002",
        departmentId: "DEPT002",
        transactionType: "出庫",
        quantity: 50,
        inputMethod: "manual",
        timestamp: "2024-01-01T14:00:00Z"
      }
    ];

    const stocktakeResults = [
      {
        itemId: "ITEM001",
        departmentId: "DEPT001",
        physicalCount: 200,
        systemCount: 195,
        stocktakeDate: "2024-01-01"
      },
      {
        itemId: "ITEM002",
        departmentId: "DEPT002",
        physicalCount: 150,
        systemCount: 150,
        stocktakeDate: "2024-01-01"
      }
    ];

    const result = extractMonthlyInventoryData(
      reportingPeriod,
      departmentList,
      inventoryTransactions,
      stocktakeResults
    );

    // 部署別サマリーの検証
    expect(result.departmentSummaries).toHaveLength(2);
    
    const dept001Summary = result.departmentSummaries.find(s => s.departmentId === "DEPT001");
    expect(dept001Summary.totalTransactions).toBe(1);
    expect(dept001Summary.inputMethodBreakdown.scanner).toBe(1);
    expect(dept001Summary.accuracyRate).toBe(1.0); // 差異率5%以内

    const dept002Summary = result.departmentSummaries.find(s => s.departmentId === "DEPT002");
    expect(dept002Summary.totalTransactions).toBe(1);
    expect(dept002Summary.inputMethodBreakdown.manual).toBe(1);
    expect(dept002Summary.accuracyRate).toBe(1.0); // 差異なし

    // 棚卸差異の検証
    expect(result.stocktakeVariances).toHaveLength(2);
    
    const item001Variance = result.stocktakeVariances.find(v => v.itemId === "ITEM001");
    expect(item001Variance.variance).toBe(5); // 200 - 195
    expect(item001Variance.variancePercentage).toBe(2.5); // 5/200*100

    const item002Variance = result.stocktakeVariances.find(v => v.itemId === "ITEM002");
    expect(item002Variance.variance).toBe(0);
    expect(item002Variance.variancePercentage).toBe(0);

    // 全体精度の検証
    expect(result.overallAccuracy).toBe(1.0); // 加重平均
    expect(result.dataQualityScore).toBe(100); // 100%
  });
});
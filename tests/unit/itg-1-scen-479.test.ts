import { extractMonthlyInventoryData } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("在庫データが存在しない期間を指定した場合にエラーが返される", () => {
    // SCEN-479
    const reportingPeriod = {
      startDate: "2030-01-01",
      endDate: "2030-01-31"
    };
    const departmentList = ["DEPT001", "DEPT002"];
    const inventoryTransactions = [];
    const stocktakeResults = [];

    expect(() => extractMonthlyInventoryData(
      reportingPeriod,
      departmentList,
      inventoryTransactions,
      stocktakeResults
    )).toThrow(/在庫取引記録/);
  });
});
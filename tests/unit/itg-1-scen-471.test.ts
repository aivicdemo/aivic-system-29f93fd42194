import { setProductionDataExtractionPeriod } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("月次生産実績データ抽出機能 - 対象期間の生産実績データが正常に抽出される", () => {
    // SCEN-471
    
    const reportingMonth = "2024-01";
    const currentDate = new Date("2024-02-05T10:00:00Z");
    const fiscalYearStartMonth = 4;
    
    const result = setProductionDataExtractionPeriod(reportingMonth, currentDate, fiscalYearStartMonth);
    
    expect(result.startDate).toBe("2024-01-01");
    expect(result.endDate).toBe("2024-01-31");
    expect(result.periodType).toBe("月次");
    expect(result.isCurrentMonth).toBe(false);
  });
});
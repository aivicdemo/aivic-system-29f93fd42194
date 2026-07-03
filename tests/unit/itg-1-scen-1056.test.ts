import { generateSalesReportAggregationManual } from "../../src/logic/it-1-2-1";

describe("営業報告書集計標準手順書生成機能", () => {
  // SCEN-1056
  test("営業活動データが0件の場合、集計手順書生成がエラーをハンドルし、警告メッセージを表示する", () => {
    const salesActivitiesData: any[] = [];

    expect(() => {
      generateSalesReportAggregationManual(salesActivitiesData);
    }).toThrow(/データが存在しません/);
  });
});
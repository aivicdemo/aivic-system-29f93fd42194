import { confirmAggregationPeriod } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-985
  test("月次データ集計対象期間の確定 - 開始日が終了日より後の場合、エラーが返される", () => {
    const start_date = new Date("2024-12-01T00:00:00Z");
    const end_date = new Date("2024-11-30T23:59:59Z");

    expect(() =>
      confirmAggregationPeriod({
        start_date,
        end_date,
      })
    ).toThrow(/開始日は終了日以前である必要があります/);
  });
});
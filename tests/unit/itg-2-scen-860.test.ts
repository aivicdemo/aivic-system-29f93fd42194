import { calculateMonthlyJudgmentVariance } from "../../src/logic/it-6-2-2-1";

describe("月次判定ばらつき率・相場乖離傾向集計機能", () => {
  // SCEN-860
  test("集計対象期間のデータが不完全な場合にエラーを返却する", () => {
    const incompleteStartDate = new Date("2024-01-01T00:00:00Z");
    const incompleteEndDate = new Date("2024-01-15T23:59:59Z");

    const incompleteAggregationRequest = {
      aggregationStartDate: incompleteStartDate,
      aggregationEndDate: incompleteEndDate,
      departmentId: "DEPT-001",
      dataCompletionCheckRequired: true,
    };

    expect(() =>
      calculateMonthlyJudgmentVariance(incompleteAggregationRequest)
    ).toThrow(/データ不完全/);
  });
});
import { analyzeJudgmentDifferences } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員間判定差異分析", () => {
  // SCEN-874
  test("比較対象の査定員が1名以下の場合、エラーを返す", () => {
    const appraiserIds = ["A001"];
    const targetMonth = "2024-01";
    const judgmentData = [
      {
        appraiserId: "A001",
        estimateId: "EST001",
        divergenceRate: 5.2,
      },
    ];

    expect(() =>
      analyzeJudgmentDifferences(appraiserIds, targetMonth, judgmentData)
    ).toThrow(/査定員/);
  });
});
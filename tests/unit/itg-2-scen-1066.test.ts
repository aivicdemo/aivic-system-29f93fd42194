import { analyzeJudgmentAccuracyByAssessor } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員別判定精度・乖離パターン分析", () => {
  // SCEN-1066
  test("入力データが空の場合、エラーを返す", () => {
    const emptyInput = {};

    expect(() => analyzeJudgmentAccuracyByAssessor(emptyInput as any)).toThrow(
      /入力データが不足しています|必須項目が空です/
    );
  });
});
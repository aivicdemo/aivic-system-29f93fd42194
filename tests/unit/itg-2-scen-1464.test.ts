import { calculatePriorityScore } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  // SCEN-1464: [error] 優先度スコア算出機能 - 影響度スコアが数値以外の場合、エラーを返す
  test("優先度スコア算出時に影響度スコアが数値以外の場合、エラーを返す", () => {
    const input = {
      impactScore: "invalid" as any,
      implementationDifficultyScore: 50,
    };

    expect(() => {
      calculatePriorityScore(input);
    }).toThrow(/影響度スコア/);
  });
});
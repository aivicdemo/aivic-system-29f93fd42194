import { calculateImprovementPriorityScore } from "../../src/logic/it-6-2-2-1";

describe("改善優先度スコア算出機能", () => {
  test("SCEN-1154: 影響度スコア100・実装難度スコア0の場合、優先度スコアが最大値100に算出される", () => {
    const impact_score = 100;
    const implementation_difficulty_score = 0;

    const priority_score = calculateImprovementPriorityScore({
      impact_score,
      implementation_difficulty_score,
    });

    expect(priority_score).toBe(100);
  });
});
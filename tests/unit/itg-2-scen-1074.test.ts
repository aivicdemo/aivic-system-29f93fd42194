import { calculateEducationalPriorityScore } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1074: 教育指導優先度の自動付与 - 能力差スコアが負の値の場合、エラーを返す", () => {
    const input = {
      ability_gap_score: -5,
      proficiency_level: "新人" as const,
      improvement_area: "工種別判定精度",
    };

    expect(() =>
      calculateEducationalPriorityScore(input)
    ).toThrow(/能力差スコア/);
  });
});
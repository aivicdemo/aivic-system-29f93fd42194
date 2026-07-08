import { evaluateImprovementTargetAchievement } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1235
  test("改善目標値達成判定と次ステップ自動決定 - 改善後の値が改善目標値と同値である場合、運用継続と判定される", () => {
    const baseline_value = 100;
    const target_value = 120;
    const post_improvement_value = 120;

    const result = evaluateImprovementTargetAchievement({
      baseline_value,
      target_value,
      post_improvement_value,
    });

    expect(result.achievement_status).toBe("達成");
    expect(result.next_step).toBe("運用継続");
    expect(result.system_status).toBe("運用継続");
    expect(result.improvement_rate).toBe(20);
    expect(result.achievement_log).toMatch(/改善目標値達成/);
    expect(result.achievement_log).toMatch(/同値/);
    expect(result.detailed_log).toEqual(
      expect.objectContaining({
        baseline: 100,
        target: 120,
        actual: 120,
        achieved: true,
        reason: "post_improvement_value equals target_value",
      })
    );
  });
});
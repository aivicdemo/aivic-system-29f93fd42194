import { determineProficiencyPhase } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-934: [edge] 新入スタッフ段階的育成機能 - 複数の習熟度判定基準が定義されている場合、最も制限的な基準に基づいて次フェーズが判定される
  test("複数の習熟度判定基準が定義されている場合、最も制限的な基準に基づいて次フェーズが判定される", () => {
    const criteria_a = {
      criterion_id: "CRIT_A",
      threshold_score: 80,
      priority_level: 1,
      description: "基準A",
    };
    const criteria_b = {
      criterion_id: "CRIT_B",
      threshold_score: 85,
      priority_level: 2,
      description: "基準B",
    };
    const criteria_c = {
      criterion_id: "CRIT_C",
      threshold_score: 90,
      priority_level: 3,
      description: "基準C",
    };

    const all_criteria = [criteria_a, criteria_b, criteria_c];

    const staff_evaluation = {
      staff_id: "STAFF_001",
      scores: {
        CRIT_A: 92,
        CRIT_B: 88,
        CRIT_C: 80,
      },
    };

    const result = determineProficiencyPhase({
      all_criteria: all_criteria,
      staff_evaluation: staff_evaluation,
    });

    // 最も制限的な基準（基準C: 90点以上）が適用される
    expect(result.applied_criterion_id).toBe("CRIT_C");
    expect(result.applied_threshold).toBe(90);

    // スタッフの基準C評価は80点で、90点以上という条件を満たさない
    expect(result.staff_score_for_applied_criterion).toBe(80);
    expect(result.phase_advancement_approved).toBe(false);

    // 判定理由にどの基準が適用されたかが明記されている
    expect(result.decision_reason).toMatch(/基準C/);
    expect(result.decision_reason).toMatch(/90/);

    // 監査ログにも基準Cが記録されている
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.selected_criterion_id).toBe("CRIT_C");
    expect(result.audit_log.selection_reason).toMatch(/制限的/);
  });
});
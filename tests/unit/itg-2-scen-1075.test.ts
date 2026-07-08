import { assignEducationPriority } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1075
  test("能力差スコアが100（最大差）の境界値で最高優先度が付与される", () => {
    const input = {
      appraiser_id: "APPRAISER_001",
      proficiency_level: "junior",
      capability_diff_score: 100,
      divergence_pattern: "high_deviation",
      processing_time_seconds: 1200,
      judgment_accuracy_percent: 65,
    };

    const result = assignEducationPriority(input);

    expect(result.priority_level).toBe(1);
    expect(result.priority_label).toBe("最高優先度");
    expect(result.appraiser_id).toBe("APPRAISER_001");
    expect(result.capability_diff_score).toBe(100);
    expect(result.recommended_education_topics).toEqual([
      "相場判定基準の統一化",
      "乖離パターン判別",
      "過去案件データ活用法",
    ]);
    expect(result.recommended_education_topics.length).toBe(3);
    expect(result.education_urgency_days).toBe(3);
    expect(result.estimated_training_hours).toBe(16);
    expect(result.priority_rationale).toContain("能力差スコア100");
    expect(result.priority_rationale).toContain("最優先指導対象");
    expect(typeof result.assigned_at).toBe("string");
    expect(result.priority_basis).toEqual({
      capability_diff_factor: 100,
      accuracy_gap_factor: 35,
      total_priority_score: 100,
      threshold_exceeded: true,
    });
  });
});
import { determinePriorityScores } from "../../src/logic/it-6-2-2-1";

describe("改善優先度決定機能", () => {
  test("SCEN-1469: 複数の改善要因の影響度が同等の場合の優先度決定が正確に行われる", () => {
    // 前提：複数の改善要因を同一の影響度スコア（5.0）で設定
    const improvement_factors = [
      {
        factor_id: "factor_001",
        factor_name: "要因A",
        impact_score: 5.0,
        importance_score: 5.0,
        occurrence_frequency: 3,
        implementation_difficulty: 2,
        cost_effectiveness_ratio: 0.8,
      },
      {
        factor_id: "factor_002",
        factor_name: "要因B",
        impact_score: 5.0,
        importance_score: 5.0,
        occurrence_frequency: 5,
        implementation_difficulty: 1,
        cost_effectiveness_ratio: 0.9,
      },
      {
        factor_id: "factor_003",
        factor_name: "要因C",
        impact_score: 5.0,
        importance_score: 5.0,
        occurrence_frequency: 2,
        implementation_difficulty: 3,
        cost_effectiveness_ratio: 0.7,
      },
    ];

    // 優先度決定ロジックを実行（第1回目）
    const priority_result_1 = determinePriorityScores({
      factors: improvement_factors,
      secondary_sort_criteria: [
        "occurrence_frequency",
        "implementation_difficulty",
        "cost_effectiveness_ratio",
      ],
    });

    // 優先度決定ロジックを実行（第2回目 - 再現性確認）
    const priority_result_2 = determinePriorityScores({
      factors: improvement_factors,
      secondary_sort_criteria: [
        "occurrence_frequency",
        "implementation_difficulty",
        "cost_effectiveness_ratio",
      ],
    });

    // 検証1：同等の影響度を持つ要因同士の優先度がセカンダリソート基準に基づいて排序される
    // セカンダリソート基準の優先順：occurrence_frequency (降順) → implementation_difficulty (昇順) → cost_effectiveness_ratio (降順)
    // 期待される排序：
    // 1位：要因B (occurrence_frequency=5, implementation_difficulty=1, cost_effectiveness_ratio=0.9)
    // 2位：要因A (occurrence_frequency=3, implementation_difficulty=2, cost_effectiveness_ratio=0.8)
    // 3位：要因C (occurrence_frequency=2, implementation_difficulty=3, cost_effectiveness_ratio=0.7)

    expect(priority_result_1.ranked_factors[0].factor_id).toBe("factor_002");
    expect(priority_result_1.ranked_factors[0].priority_score).toBe(5.45);
    expect(priority_result_1.ranked_factors[1].factor_id).toBe("factor_001");
    expect(priority_result_1.ranked_factors[1].priority_score).toBe(5.1);
    expect(priority_result_1.ranked_factors[2].factor_id).toBe("factor_003");
    expect(priority_result_1.ranked_factors[2].priority_score).toBe(4.65);

    // 検証2：同じ条件で複数回実行しても優先度の排序順序が一貫している
    expect(priority_result_2.ranked_factors[0].factor_id).toBe("factor_002");
    expect(priority_result_2.ranked_factors[0].priority_score).toBe(5.45);
    expect(priority_result_2.ranked_factors[1].factor_id).toBe("factor_001");
    expect(priority_result_2.ranked_factors[1].priority_score).toBe(5.1);
    expect(priority_result_2.ranked_factors[2].factor_id).toBe("factor_003");
    expect(priority_result_2.ranked_factors[2].priority_score).toBe(4.65);

    // 検証3：優先度スコアが予測可能で再現性がある
    expect(priority_result_1.ranked_factors).toEqual(
      priority_result_2.ranked_factors
    );

    // 検証4：優先度ランクが確実に割り振られている
    expect(priority_result_1.ranked_factors[0].priority_rank).toBe(1);
    expect(priority_result_1.ranked_factors[1].priority_rank).toBe(2);
    expect(priority_result_1.ranked_factors[2].priority_rank).toBe(3);

    // 検証5：すべての要因が結果に含まれている
    expect(priority_result_1.ranked_factors.length).toBe(3);

    // 検証6：結果にメタデータが含まれている
    expect(priority_result_1.evaluation_timestamp).toBeDefined();
    expect(priority_result_1.sort_criteria_applied).toEqual([
      "occurrence_frequency",
      "implementation_difficulty",
      "cost_effectiveness_ratio",
    ]);

    // 検証7：セカンダリソート基準がない場合、エラーが発生しないこと（デフォルト動作）
    const priority_result_default = determinePriorityScores({
      factors: improvement_factors,
    });
    expect(priority_result_default.ranked_factors.length).toBe(3);
  });
});
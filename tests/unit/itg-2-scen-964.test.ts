import { calculatePersonnelAllocationScenarioScores } from "../../src/logic/it-6-2-1-1";

describe("人員配置シナリオの評価指標自動計算と最適案提示", () => {
  test("SCEN-964: 複数シナリオの優先度ウェイト適用による総合スコア自動計算と降順ランク付け", () => {
    // 【入力】3つの人員配置シナリオと優先度ウェイト定義
    const scenario_A = {
      scenario_id: "scenario_001",
      scenario_name: "標準配置案",
      quality_score: 85,
      efficiency_score: 75,
      cost_score: 70,
      risk_score: 60,
    };

    const scenario_B = {
      scenario_id: "scenario_002",
      scenario_name: "効率重視案",
      quality_score: 75,
      efficiency_score: 90,
      cost_score: 65,
      risk_score: 55,
    };

    const scenario_C = {
      scenario_id: "scenario_003",
      scenario_name: "低コスト案",
      quality_score: 70,
      efficiency_score: 60,
      cost_score: 95,
      risk_score: 45,
    };

    const scenarios = [scenario_A, scenario_B, scenario_C];

    // 優先度ウェイト定義（合計100%）
    const priority_weights_v1 = {
      quality_weight: 40,
      efficiency_weight: 30,
      cost_weight: 20,
      risk_weight: 10,
    };

    // 【実行】シナリオ群に対して優先度ウェイトを適用して総合スコア計算
    const result_v1 = calculatePersonnelAllocationScenarioScores(
      scenarios,
      priority_weights_v1
    );

    // 【期待値計算】各シナリオの総合スコア
    // scenario_A: (85*0.4) + (75*0.3) + (70*0.2) + (60*0.1) = 34 + 22.5 + 14 + 6 = 76.5
    // scenario_B: (75*0.4) + (90*0.3) + (65*0.2) + (55*0.1) = 30 + 27 + 13 + 5.5 = 75.5
    // scenario_C: (70*0.4) + (60*0.3) + (95*0.2) + (45*0.1) = 28 + 18 + 19 + 4.5 = 69.5
    // 降順ソート: [scenario_A (76.5), scenario_B (75.5), scenario_C (69.5)]

    // 【検証】総合スコア計算が正確であること
    expect(result_v1.ranked_scenarios[0].scenario_id).toBe("scenario_001");
    expect(result_v1.ranked_scenarios[0].total_score).toBe(76.5);
    expect(result_v1.ranked_scenarios[0].rank).toBe(1);

    expect(result_v1.ranked_scenarios[1].scenario_id).toBe("scenario_002");
    expect(result_v1.ranked_scenarios[1].total_score).toBe(75.5);
    expect(result_v1.ranked_scenarios[1].rank).toBe(2);

    expect(result_v1.ranked_scenarios[2].scenario_id).toBe("scenario_003");
    expect(result_v1.ranked_scenarios[2].total_score).toBe(69.5);
    expect(result_v1.ranked_scenarios[2].rank).toBe(3);

    // 【検証】最優先シナリオが最適案として特定されたこと
    expect(result_v1.optimal_scenario_id).toBe("scenario_001");
    expect(result_v1.optimal_scenario_name).toBe("標準配置案");

    // 【検証】ランキングが降順で正しく並んでいること
    expect(result_v1.ranked_scenarios[0].total_score).toBeGreaterThan(
      result_v1.ranked_scenarios[1].total_score
    );
    expect(result_v1.ranked_scenarios[1].total_score).toBeGreaterThan(
      result_v1.ranked_scenarios[2].total_score
    );

    // 【検証】各シナリオの計算根拠が記録されていること
    expect(result_v1.ranked_scenarios[0].calculation_breakdown).toEqual({
      quality_contribution: 34,
      efficiency_contribution: 22.5,
      cost_contribution: 14,
      risk_contribution: 6,
    });

    expect(result_v1.ranked_scenarios[1].calculation_breakdown).toEqual({
      quality_contribution: 30,
      efficiency_contribution: 27,
      cost_contribution: 13,
      risk_contribution: 5.5,
    });

    expect(result_v1.ranked_scenarios[2].calculation_breakdown).toEqual({
      quality_contribution: 28,
      efficiency_contribution: 18,
      cost_contribution: 19,
      risk_contribution: 4.5,
    });

    // 【検証】優先度ウェイト情報が結果に含まれていること
    expect(result_v1.applied_weights).toEqual(priority_weights_v1);

    // ==========================================
    // 【異なる優先度ウェイトで再計算】ランキング変動を確認
    // ==========================================

    const priority_weights_v2 = {
      quality_weight: 20,
      efficiency_weight: 50,
      cost_weight: 20,
      risk_weight: 10,
    };

    // 【実行】異なるウェイトで再計算
    const result_v2 = calculatePersonnelAllocationScenarioScores(
      scenarios,
      priority_weights_v2
    );

    // 【期待値計算】新しいウェイトでのスコア
    // scenario_A: (85*0.2) + (75*0.5) + (70*0.2) + (60*0.1) = 17 + 37.5 + 14 + 6 = 74.5
    // scenario_B: (75*0.2) + (90*0.5) + (65*0.2) + (55*0.1) = 15 + 45 + 13 + 5.5 = 78.5
    // scenario_C: (70*0.2) + (60*0.5) + (95*0.2) + (45*0.1) = 14 + 30 + 19 + 4.5 = 67.5
    // 降順ソート: [scenario_B (78.5), scenario_A (74.5), scenario_C (67.5)]

    // 【検証】効率重視ウェイトによってランキングが変動したこと
    expect(result_v2.ranked_scenarios[0].scenario_id).toBe("scenario_002");
    expect(result_v2.ranked_scenarios[0].total_score).toBe(78.5);
    expect(result_v2.ranked_scenarios[0].rank).toBe(1);

    expect(result_v2.ranked_scenarios[1].scenario_id).toBe("scenario_001");
    expect(result_v2.ranked_scenarios[1].total_score).toBe(74.5);
    expect(result_v2.ranked_scenarios[1].rank).toBe(2);

    expect(result_v2.ranked_scenarios[2].scenario_id).toBe("scenario_003");
    expect(result_v2.ranked_scenarios[2].total_score).toBe(67.5);
    expect(result_v2.ranked_scenarios[2].rank).toBe(3);

    // 【検証】最優先シナリオが変更されたこと
    expect(result_v2.optimal_scenario_id).toBe("scenario_002");
    expect(result_v2.optimal_scenario_name).toBe("効率重視案");

    // 【検証】新しいウェイト情報が結果に反映されていること
    expect(result_v2.applied_weights).toEqual(priority_weights_v2);

    // ==========================================
    // 【3番目のウェイトパターン】コスト重視での検証
    // ==========================================

    const priority_weights_v3 = {
      quality_weight: 10,
      efficiency_weight: 20,
      cost_weight: 60,
      risk_weight: 10,
    };

    // 【実行】コスト重視ウェイトで計算
    const result_v3 = calculatePersonnelAllocationScenarioScores(
      scenarios,
      priority_weights_v3
    );

    // 【期待値計算】コスト重視ウェイトでのスコア
    // scenario_A: (85*0.1) + (75*0.2) + (70*0.6) + (60*0.1) = 8.5 + 15 + 42 + 6 = 71.5
    // scenario_B: (75*0.1) + (90*0.2) + (65*0.6) + (55*0.1) = 7.5 + 18 + 39 + 5.5 = 70
    // scenario_C: (70*0.1) + (60*0.2) + (95*0.6) + (45*0.1) = 7 + 12 + 57 + 4.5 = 80.5
    // 降順ソート: [scenario_C (80.5), scenario_A (71.5), scenario_B (70)]

    // 【検証】コスト重視でランキングが最適化されたこと
    expect(result_v3.ranked_scenarios[0].scenario_id).toBe("scenario_003");
    expect(result_v3.ranked_scenarios[0].total_score).toBe(80.5);
    expect(result_v3.ranked_scenarios[0].rank).toBe(1);

    expect(result_v3.ranked_scenarios[1].scenario_id).toBe("scenario_001");
    expect(result_v3.ranked_scenarios[1].total_score).toBe(71.5);
    expect(result_v3.ranked_scenarios[1].rank).toBe(2);

    expect(result_v3.ranked_scenarios[2].scenario_id).toBe("scenario_002");
    expect(result_v3.ranked_scenarios[2].total_score).toBe(70);
    expect(result_v3.ranked_scenarios[2].rank).toBe(3);

    // 【検証】最優先シナリオが低コスト案に変わったこと
    expect(result_v3.optimal_scenario_id).toBe("scenario_003");
    expect(result_v3.optimal_scenario_name).toBe("低コスト案");

    // ==========================================
    // 【結果構造体の統合検証】
    // ==========================================

    // 【検証】結果オブジェクトが必須フィールドをすべて含むこと
    expect(result_v1).toHaveProperty("ranked_scenarios");
    expect(result_v1).toHaveProperty("optimal_scenario_id");
    expect(result_v1).toHaveProperty("optimal_scenario_name");
    expect(result_v1).toHaveProperty("applied_weights");
    expect(result_v1).toHaveProperty("timestamp");

    // 【検証】ランク付け結果の配列長が入力シナリオ数と一致すること
    expect(result_v1.ranked_scenarios).toHaveLength(3);
    expect(result_v2.ranked_scenarios).toHaveLength(3);
    expect(result_v3.ranked_scenarios).toHaveLength(3);

    // 【検証】タイムスタンプが有効な ISO 8601 形式であること
    expect(new Date(result_v1.timestamp).toISOString()).toBeDefined();
  });
});
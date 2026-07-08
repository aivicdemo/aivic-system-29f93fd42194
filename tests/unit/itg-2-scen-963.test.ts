import { calculateStaffingScenarioMetrics } from "../../src/logic/it-6-2-1-1";

describe("人員配置シナリオの評価指標自動計算と最適案提示", () => {
  test("SCEN-963: コスト・品質・リスク優先度に基づいてシナリオ評価指標を自動計算し最適案を提示", () => {
    // === 準備フェーズ: 複数の人員配置シナリオを定義 ===
    const scenarios = [
      {
        scenario_id: "scenario_a",
        scenario_name: "シナリオA: 最小人員配置",
        total_staff: 25,
        peak_period_additional_staff: 5,
        monthly_salary_cost: 3750000,
        training_period_days: 10,
        quality_uniformity_index: 0.72,
        system_uptime_percentage: 0.96,
        rework_rate: 0.08,
      },
      {
        scenario_id: "scenario_b",
        scenario_name: "シナリオB: 標準人員配置",
        total_staff: 30,
        peak_period_additional_staff: 8,
        monthly_salary_cost: 4500000,
        training_period_days: 7,
        quality_uniformity_index: 0.85,
        system_uptime_percentage: 0.98,
        rework_rate: 0.05,
      },
      {
        scenario_id: "scenario_c",
        scenario_name: "シナリオC: 充実人員配置",
        total_staff: 35,
        peak_period_additional_staff: 10,
        monthly_salary_cost: 5250000,
        training_period_days: 5,
        quality_uniformity_index: 0.92,
        system_uptime_percentage: 0.99,
        rework_rate: 0.02,
      },
    ];

    // === シナリオ1: 初期優先度設定 (コスト40%, 品質35%, リスク25%) ===
    const prioritySettings1 = {
      cost_priority_weight: 0.4,
      quality_priority_weight: 0.35,
      risk_priority_weight: 0.25,
    };

    const result1 = calculateStaffingScenarioMetrics({
      scenarios,
      priority_settings: prioritySettings1,
    });

    // === 評価指標の自動計算結果を検証 ===
    // コスト評価: 月額給与コストが低いほど高得点。相対比較で正規化
    // 品質評価: 品質均一化指標が高く、リワーク率が低いほど高得点
    // リスク評価: システム稼働率が高く、研修期間が短いほど高得点

    // シナリオA: コスト最小(3750000) → コスト得点 100
    // シナリオB: コスト中間(4500000) → コスト得点 81.48（= (5250000-4500000)/(5250000-3750000)*100）
    // シナリオC: コスト最大(5250000) → コスト得点 0

    // シナリオA: 品質得点 = (0.72-0.72)/(0.92-0.72)*100 = 0, リワーク(0.08) → 品質スコア低い
    // シナリオB: 品質得点 = (0.85-0.72)/(0.92-0.72)*100 = 65, リワーク(0.05) → 品質スコア中程度
    // シナリオC: 品質得点 = (0.92-0.72)/(0.92-0.72)*100 = 100, リワーク(0.02) → 品質スコア高い

    // シナリオA: リスク得点 = (0.96*100-0.96*100)*100 + (10-5)/(10-5)*100 = 96 + 100 = 計算方式により異なる
    // 稼働率とリスク: (0.96-0.96)/(0.99-0.96)*100 = 0, 研修期間: (10-5)/(10-5)*100 = 100
    // シナリオB: 稼働率 (0.98-0.96)/(0.99-0.96)*100 = 66.67, 研修期間: (7-5)/(10-5)*100 = 40
    // シナリオC: 稼働率 (0.99-0.96)/(0.99-0.96)*100 = 100, 研修期間: (5-5)/(10-5)*100 = 0

    // 各シナリオの総合スコア計算
    // シナリオA: 100*0.4 + 20*0.35 + 50*0.25 = 40 + 7 + 12.5 = 59.5
    // シナリオB: 81.48*0.4 + 65*0.35 + 53.33*0.25 = 32.59 + 22.75 + 13.33 = 68.67
    // シナリオC: 0*0.4 + 100*0.35 + 100*0.25 = 0 + 35 + 25 = 60

    expect(result1).toBeDefined();
    expect(result1.scenario_metrics).toBeDefined();
    expect(result1.scenario_metrics.length).toBe(3);

    // 各シナリオの評価指標が計算されていることを検証
    const metricsA = result1.scenario_metrics.find(
      (m) => m.scenario_id === "scenario_a"
    );
    const metricsB = result1.scenario_metrics.find(
      (m) => m.scenario_id === "scenario_b"
    );
    const metricsC = result1.scenario_metrics.find(
      (m) => m.scenario_id === "scenario_c"
    );

    expect(metricsA).toBeDefined();
    expect(metricsB).toBeDefined();
    expect(metricsC).toBeDefined();

    // コスト評価スコアの計算結果を検証
    expect(meticsA!.cost_score).toBe(100);
    expect(meticsB!.cost_score).toBeCloseTo(81.48, 1);
    expect(meticsC!.cost_score).toBe(0);

    // 品質評価スコアの計算結果を検証
    expect(meticsA!.quality_score).toBeCloseTo(20, 0);
    expect(meticsB!.quality_score).toBe(65);
    expect(meticsC!.quality_score).toBe(100);

    // リスク評価スコアの計算結果を検証
    expect(meticsA!.risk_score).toBeCloseTo(50, 0);
    expect(meticsB!.risk_score).toBeCloseTo(53.33, 1);
    expect(meticsC!.risk_score).toBe(100);

    // 総合スコアの計算結果を検証
    expect(meticsA!.total_composite_score).toBeCloseTo(59.5, 1);
    expect(meticsB!.total_composite_score).toBeCloseTo(68.67, 1);
    expect(meticsC!.total_composite_score).toBe(60);

    // 優先度別スコアの計算結果を検証
    expect(meticsA!.cost_weighted_score).toBeCloseTo(40, 0);
    expect(meticsA!.quality_weighted_score).toBeCloseTo(7, 0);
    expect(meticsA!.risk_weighted_score).toBeCloseTo(12.5, 1);

    expect(meticsB!.cost_weighted_score).toBeCloseTo(32.59, 1);
    expect(meticsB!.quality_weighted_score).toBeCloseTo(22.75, 1);
    expect(meticsB!.risk_weighted_score).toBeCloseTo(13.33, 1);

    expect(meticsC!.cost_weighted_score).toBe(0);
    expect(meticsC!.quality_weighted_score).toBe(35);
    expect(meticsC!.risk_weighted_score).toBe(25);

    // 最適案の提示を検証
    expect(result1.optimal_scenario_id).toBe("scenario_b");
    expect(result1.optimal_scenario_details).toBeDefined();
    expect(result1.optimal_scenario_details.scenario_id).toBe("scenario_b");
    expect(result1.optimal_scenario_details.total_composite_score).toBeCloseTo(
      68.67,
      1
    );
    expect(result1.optimal_scenario_details.reason).toContain("コスト");
    expect(result1.optimal_scenario_details.reason).toContain("品質");
    expect(result1.optimal_scenario_details.reason).toContain("リスク");

    // === シナリオ2: 優先度を変更 (コスト30%, 品質40%, リスク30%) ===
    const prioritySettings2 = {
      cost_priority_weight: 0.3,
      quality_priority_weight: 0.4,
      risk_priority_weight: 0.3,
    };

    const result2 = calculateStaffingScenarioMetrics({
      scenarios,
      priority_settings: prioritySettings2,
    });

    // 新しい優先度での総合スコア計算
    // シナリオA: 100*0.3 + 20*0.4 + 50*0.3 = 30 + 8 + 15 = 53
    // シナリオB: 81.48*0.3 + 65*0.4 + 53.33*0.3 = 24.44 + 26 + 16 = 66.44
    // シナリオC: 0*0.3 + 100*0.4 + 100*0.3 = 0 + 40 + 30 = 70

    const meticsA2 = result2.scenario_metrics.find(
      (m) => m.scenario_id === "scenario_a"
    );
    const meticsB2 = result2.scenario_metrics.find(
      (m) => m.scenario_id === "scenario_b"
    );
    const meticsC2 = result2.scenario_metrics.find(
      (m) => m.scenario_id === "scenario_c"
    );

    expect(meticsA2!.total_composite_score).toBe(53);
    expect(meticsB2!.total_composite_score).toBeCloseTo(66.44, 1);
    expect(meticsC2!.total_composite_score).toBe(70);

    // 優先度変更後の最適案が更新されることを検証
    expect(result2.optimal_scenario_id).toBe("scenario_c");
    expect(result2.optimal_scenario_details.scenario_id).toBe("scenario_c");
    expect(result2.optimal_scenario_details.total_composite_score).toBe(70);

    // 優先度変更前後で異なる最適案が提示されることを確認
    expect(result1.optimal_scenario_id).not.toBe(result2.optimal_scenario_id);

    // === 根拠情報の検証 ===
    expect(result2.optimal_scenario_details.rationale_details).toBeDefined();
    expect(
      result2.optimal_scenario_details.rationale_details.cost_contribution
    ).toBeDefined();
    expect(
      result2.optimal_scenario_details.rationale_details.quality_contribution
    ).toBeDefined();
    expect(
      result2.optimal_scenario_details.rationale_details.risk_contribution
    ).toBeDefined();

    // === 計算ロジック精度の検証 ===
    // シナリオBの詳細な優先度別寄与度を検証
    expect(meticsB2!.cost_weighted_score).toBeCloseTo(
      meticsB2!.cost_score * 0.3,
      2
    );
    expect(meticsB2!.quality_weighted_score).toBeCloseTo(
      meticsB2!.quality_score * 0.4,
      2
    );
    expect(meticsB2!.risk_weighted_score).toBeCloseTo(
      meticsB2!.risk_score * 0.3,
      2
    );

    // 総合スコアが各優先度別スコアの合計と一致することを検証
    const expectedTotalB2 =
      meticsB2!.cost_weighted_score +
      meticsB2!.quality_weighted_score +
      meticsB2!.risk_weighted_score;
    expect(meticsB2!.total_composite_score).toBeCloseTo(expectedTotalB2, 2);

    // === 各シナリオの詳細根拠情報を検証 ===
    meticsA2!.rationale = meticsA2!.rationale || "";
    meticsB2!.rationale = meticsB2!.rationale || "";
    meticsC2!.rationale = meticsC2!.rationale || "";

    expect(meticsA2!.rationale).toContain("人員");
    expect(meticsB2!.rationale).toContain("標準");
    expect(meticsC2!.rationale).toContain("充実");
  });
});
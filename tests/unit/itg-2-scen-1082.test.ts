import { generateMonthlyAllocationScenarios } from "../../src/logic/it-6-2-2-2";

describe("月次人員配置計画の策定 - 査定員能力レベル別配置シナリオ生成", () => {
  test("SCEN-1082: 査定員の能力レベル別に最適な配置シナリオが複数提示される", () => {
    // 入力: 査定員の能力レベル情報と配置対象案件データ
    const assessors = [
      { assessor_id: "ASS001", ability_level: "senior", avg_processing_time: 18, monthly_capacity: 45 },
      { assessor_id: "ASS002", ability_level: "senior", avg_processing_time: 19, monthly_capacity: 43 },
      { assessor_id: "ASS003", ability_level: "mid", avg_processing_time: 25, monthly_capacity: 32 },
      { assessor_id: "ASS004", ability_level: "mid", avg_processing_time: 26, monthly_capacity: 31 },
      { assessor_id: "ASS005", ability_level: "mid", avg_processing_time: 27, monthly_capacity: 30 },
      { assessor_id: "ASS006", ability_level: "junior", avg_processing_time: 35, monthly_capacity: 22 },
      { assessor_id: "ASS007", ability_level: "junior", avg_processing_time: 36, monthly_capacity: 21 },
    ];

    const projects = [
      { project_id: "PROJ001", complexity_level: "high", estimated_volume: 25 },
      { project_id: "PROJ002", complexity_level: "high", estimated_volume: 23 },
      { project_id: "PROJ003", complexity_level: "mid", estimated_volume: 40 },
      { project_id: "PROJ004", complexity_level: "mid", estimated_volume: 38 },
      { project_id: "PROJ005", complexity_level: "low", estimated_volume: 45 },
      { project_id: "PROJ006", complexity_level: "low", estimated_volume: 42 },
    ];

    const monthlyRequiredVolume = 213;
    const busyPeriodThreshold = 200;

    // 関数呼び出し
    const result = generateMonthlyAllocationScenarios({
      assessors,
      projects,
      monthlyRequiredVolume,
      busyPeriodThreshold,
    });

    // 期待結果: 複数シナリオが生成される
    expect(result.scenarios.length).toBeGreaterThanOrEqual(3);

    // 各シナリオの検証
    result.scenarios.forEach((scenario) => {
      // 各シナリオが異なる配置パターンを持つ
      expect(scenario).toHaveProperty("scenario_id");
      expect(scenario).toHaveProperty("allocations");
      expect(scenario).toHaveProperty("efficiency_score");
      expect(scenario).toHaveProperty("risk_assessment");
      expect(scenario).toHaveProperty("total_capacity");
      expect(scenario).toHaveProperty("utilization_rate");

      // 配置パターンの検証
      expect(Array.isArray(scenario.allocations)).toBe(true);
      expect(scenario.allocations.length).toBeGreaterThan(0);

      // 効率性指標の検証（0～100の範囲）
      expect(scenario.efficiency_score).toBeGreaterThanOrEqual(0);
      expect(scenario.efficiency_score).toBeLessThanOrEqual(100);

      // リスク評価の検証（"low" | "medium" | "high"）
      expect(["low", "medium", "high"]).toContain(scenario.risk_assessment);

      // 総容量の検証
      expect(scenario.total_capacity).toBeGreaterThan(0);

      // 稼働率の検証
      expect(scenario.utilization_rate).toBeGreaterThanOrEqual(0);
      expect(scenario.utilization_rate).toBeLessThanOrEqual(100);

      // 各配置の検証
      scenario.allocations.forEach((allocation) => {
        expect(allocation).toHaveProperty("assessor_id");
        expect(allocation).toHaveProperty("assigned_projects");
        expect(allocation).toHaveProperty("assigned_volume");
        expect(allocation).toHaveProperty("ability_match_score");

        // 割り当てられた案件が配列であること
        expect(Array.isArray(allocation.assigned_projects)).toBe(true);

        // 割り当てボリュームが数値であること
        expect(typeof allocation.assigned_volume).toBe("number");
        expect(allocation.assigned_volume).toBeGreaterThanOrEqual(0);

        // 能力マッチスコアが0～100の範囲
        expect(allocation.ability_match_score).toBeGreaterThanOrEqual(0);
        expect(allocation.ability_match_score).toBeLessThanOrEqual(100);
      });
    });

    // シナリオの多様性確認：異なるシナリオが存在
    const scenarioIds = result.scenarios.map((s) => s.scenario_id);
    const uniqueScenarioIds = new Set(scenarioIds);
    expect(uniqueScenarioIds.size).toBe(result.scenarios.length);

    // 効率性スコアが異なるシナリオが存在
    const efficiencyScores = result.scenarios.map((s) => s.efficiency_score);
    const uniqueEfficiencyScores = new Set(efficiencyScores);
    expect(uniqueEfficiencyScores.size).toBeGreaterThanOrEqual(2);

    // 月次必要ボリュームがカバーされていることを確認
    result.scenarios.forEach((scenario) => {
      const totalAssignedVolume = scenario.allocations.reduce((sum, alloc) => sum + alloc.assigned_volume, 0);
      expect(totalAssignedVolume).toBeGreaterThanOrEqual(monthlyRequiredVolume);
    });

    // 推奨シナリオが存在し、最も効率性スコアが高いことを確認
    expect(result).toHaveProperty("recommended_scenario_id");
    const recommendedScenario = result.scenarios.find((s) => s.scenario_id === result.recommended_scenario_id);
    expect(recommendedScenario).toBeDefined();

    // 推奨シナリオが最高効率スコアを持つことを確認
    const maxEfficiencyScore = Math.max(...result.scenarios.map((s) => s.efficiency_score));
    expect(recommendedScenario!.efficiency_score).toBe(maxEfficiencyScore);

    // 各シナリオが選択可能な状態で表示されていることを確認
    result.scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty("selectable");
      expect(scenario.selectable).toBe(true);
    });

    // 稼働率情報が提供されていることを確認
    expect(result).toHaveProperty("capacity_summary");
    expect(result.capacity_summary).toHaveProperty("total_available_capacity");
    expect(result.capacity_summary).toHaveProperty("required_volume");
    expect(result.capacity_summary).toHaveProperty("utilization_status");
  });
});
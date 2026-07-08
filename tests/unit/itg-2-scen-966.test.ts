import { calculatePersonnelAllocationScenarioMetrics } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-966: [edge] 人員配置シナリオの評価指標自動計算・最適案提示 - 複数シナリオの評価指標が完全に等しい境界値で同等の最適案として扱う
  test('複数シナリオの評価指標が完全に等しい場合、同等の最適案として同じランクで提示され、僅かに低いシナリオはランク下位に位置する', () => {
    const scenario_a = {
      scenario_id: 'SCEN-A-001',
      personnel_count: 30,
      support_personnel_count: 5,
      expected_daily_capacity: 150,
      quality_score: 92.5,
      cost_efficiency_ratio: 0.88,
      risk_score: 0.12,
    };

    const scenario_b = {
      scenario_id: 'SCEN-B-001',
      personnel_count: 28,
      support_personnel_count: 5,
      expected_daily_capacity: 140,
      quality_score: 92.5,
      cost_efficiency_ratio: 0.88,
      risk_score: 0.12,
    };

    const scenario_c = {
      scenario_id: 'SCEN-C-001',
      personnel_count: 25,
      support_personnel_count: 3,
      expected_daily_capacity: 125,
      quality_score: 88.0,
      cost_efficiency_ratio: 0.82,
      risk_score: 0.18,
    };

    const scenarios = [scenario_a, scenario_b, scenario_c];

    const result = calculatePersonnelAllocationScenarioMetrics(scenarios);

    // 評価結果の構造確認
    expect(result).toBeDefined();
    expect(result.optimal_scenarios).toBeDefined();
    expect(Array.isArray(result.optimal_scenarios)).toBe(true);

    // 最適案リストにはシナリオAとシナリオBが含まれることを確認
    const optimal_scenario_ids = result.optimal_scenarios.map(s => s.scenario_id);
    expect(optimal_scenario_ids).toContain('SCEN-A-001');
    expect(optimal_scenario_ids).toContain('SCEN-B-001');

    // シナリオAとシナリオBが同じランク (rank = 1) で提示されることを確認
    const scenario_a_rank = result.optimal_scenarios.find(s => s.scenario_id === 'SCEN-A-001')?.rank;
    const scenario_b_rank = result.optimal_scenarios.find(s => s.scenario_id === 'SCEN-B-001')?.rank;
    expect(scenario_a_rank).toBe(1);
    expect(scenario_b_rank).toBe(1);

    // シナリオCが最適案リストに含まれている場合、ランクが2以上であることを確認
    const scenario_c_in_optimal = result.optimal_scenarios.find(s => s.scenario_id === 'SCEN-C-001');
    if (scenario_c_in_optimal) {
      expect(scenario_c_in_optimal.rank).toBeGreaterThanOrEqual(2);
    }

    // 評価スコアが正確に計算されていることを確認
    const scenario_a_metrics = result.optimal_scenarios.find(s => s.scenario_id === 'SCEN-A-001');
    const scenario_b_metrics = result.optimal_scenarios.find(s => s.scenario_id === 'SCEN-B-001');

    // シナリオAとシナリオBの評価スコアが完全に等しいことを確認
    expect(scenario_a_metrics?.total_evaluation_score).toBe(scenario_b_metrics?.total_evaluation_score);

    // 具体的な評価スコア値を確認 (quality_score: 92.5, cost_efficiency_ratio: 0.88 の場合)
    const expected_score_ab = 92.5 * 0.88 - 0.12 * 10;
    expect(scenario_a_metrics?.total_evaluation_score).toBeCloseTo(expected_score_ab, 1);
    expect(scenario_b_metrics?.total_evaluation_score).toBeCloseTo(expected_score_ab, 1);

    // シナリオCの評価スコアがシナリオAおよびBより低いことを確認
    const scenario_c_metrics = result.optimal_scenarios.find(s => s.scenario_id === 'SCEN-C-001');
    const expected_score_c = 88.0 * 0.82 - 0.18 * 10;
    if (scenario_c_metrics) {
      expect(scenario_c_metrics.total_evaluation_score).toBeLessThan(scenario_a_metrics?.total_evaluation_score || 0);
      expect(scenario_c_metrics.total_evaluation_score).toBeCloseTo(expected_score_c, 1);
    }

    // 複数回実行時に同等ランク内の順序が一貫していることを確認
    const result_second_run = calculatePersonnelAllocationScenarioMetrics(scenarios);
    const optimal_ids_second = result_second_run.optimal_scenarios
      .filter(s => s.rank === 1)
      .map(s => s.scenario_id);

    const optimal_ids_first = result.optimal_scenarios
      .filter(s => s.rank === 1)
      .map(s => s.scenario_id);

    expect(optimal_ids_second.sort()).toEqual(optimal_ids_first.sort());

    // 返却される最適案リストの長さが正妥当であることを確認
    expect(result.optimal_scenarios.length).toBeGreaterThanOrEqual(2);
  });
});
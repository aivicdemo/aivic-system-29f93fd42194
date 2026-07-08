import { evaluateExpansionPlanFeasibility } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-1583: 展開計画実行可否判定機能 - 査定時間短縮率がマイナス値（悪化）の場合、展開計画を「No-Go」で判定する', () => {
    const expansion_plan = {
      plan_id: 'EP-2024-01-15-001',
      target_departments: ['営業部', '企画部'],
      rollout_start_date: '2024-02-01',
      target_scale: 700,
      initial_implementation_period_months: 3,
      processing_time_reduction_rate_percent: -5.0,
      quality_uniformity_index: 0.92,
      system_uptime_rate_percent: 99.5,
      additional_learning_data_required_count: 2500,
      estimated_implementation_duration_days: 45,
      estimated_cost_jpy: 3500000,
      learning_data_sufficiency_status: 'insufficient',
      critical_regional_gaps: ['Hokkaido', 'Okinawa'],
    };

    const result = evaluateExpansionPlanFeasibility(expansion_plan);

    expect(result.feasibility_decision).toBe('No-Go');
    expect(result.decision_reason).toMatch(/査定時間短縮率がマイナス値/);
    expect(result.is_viable).toBe(false);
    expect(result.critical_issues).toContain('処理時間短縮率悪化');
    expect(result.recommendation).toMatch(/査定時間短縮率の改善/);
  });
});
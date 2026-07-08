import { describe, test, expect } from '@jest/globals';
import { generatePersonnelAllocationScenarios } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-766: [normal] 翌月必要人員数の自動計算・配置シナリオ生成機能 - 繁忙期判定基準に基づいて複数の配置シナリオが生成される
  test('should generate at least 3 personnel allocation scenarios based on busyness criteria', () => {
    // Setup: 過去3ヶ月の査定案件数データ
    const pastThreeMonthsData = {
      month_1_cases: 450,
      month_1_avg_processing_time_minutes: 28,
      month_2_cases: 520,
      month_2_avg_processing_time_minutes: 31,
      month_3_cases: 380,
      month_3_avg_processing_time_minutes: 25,
    };

    // Setup: 繁忙期判定基準の定義
    const busynessCriteria = {
      low_busyness_threshold: 400,
      medium_busyness_threshold: 500,
      high_busyness_threshold: 600,
      low_personnel_multiplier: 1.0,
      medium_personnel_multiplier: 1.3,
      high_personnel_multiplier: 1.6,
    };

    // Setup: 翌月の予測需要データ
    const nextMonthForecast = {
      predicted_case_count: 580,
      is_peak_season_flag: true,
      operational_complexity_index: 0.85,
      baseline_personnel_count: 30,
      avg_processing_capacity_per_employee: 18.5,
    };

    // Setup: 難易度分布データ
    const difficulty_distribution = {
      high_difficulty_ratio: 0.25,
      medium_difficulty_ratio: 0.50,
      low_difficulty_ratio: 0.25,
    };

    // Execute
    const scenarios = generatePersonnelAllocationScenarios({
      past_three_months_data: pastThreeMonthsData,
      busyness_criteria: busynessCriteria,
      next_month_forecast: nextMonthForecast,
      difficulty_distribution,
    });

    // Verify: シナリオが3件以上生成されること
    expect(scenarios.length).toBeGreaterThanOrEqual(3);

    // Verify: 各シナリオのスキーマが正しいこと
    scenarios.forEach((scenario) => {
      expect(scenario).toHaveProperty('scenario_id');
      expect(scenario).toHaveProperty('busyness_level');
      expect(scenario).toHaveProperty('required_personnel_count');
      expect(scenario).toHaveProperty('allocated_personnel_count');
      expect(scenario).toHaveProperty('department_allocation');
      expect(scenario).toHaveProperty('expected_completion_rate');
      expect(scenario).toHaveProperty('cost_estimate');
    });

    // Verify: 最初のシナリオの詳細検証（低繁忙度シナリオ）
    const lowBusynessScenario = scenarios.find(
      (s) => s.busyness_level === 'low'
    );
    expect(lowBusynessScenario).toBeDefined();
    expect(lowBusynessScenario!.required_personnel_count).toBeLessThanOrEqual(
      30
    );

    // Verify: 中程度繁忙度シナリオの存在と検証
    const mediumBusynessScenario = scenarios.find(
      (s) => s.busyness_level === 'medium'
    );
    expect(mediumBusynessScenario).toBeDefined();
    expect(mediumBusynessScenario!.required_personnel_count).toBeGreaterThan(
      lowBusynessScenario!.required_personnel_count
    );

    // Verify: 高繁忙度シナリオの存在と検証
    const highBusynessScenario = scenarios.find(
      (s) => s.busyness_level === 'high'
    );
    expect(highBusynessScenario).toBeDefined();
    expect(highBusynessScenario!.required_personnel_count).toBeGreaterThan(
      mediumBusynessScenario!.required_personnel_count
    );

    // Verify: 予測案件数580件に対する必要人員数の計算
    // 平均処理能力 18.5件/人を考慮すると、必要基本人員 = 580 / 18.5 ≈ 31.35人
    // 高繁忙度時（1.6倍）= 31.35 * 1.6 ≈ 50.16人 → 51人
    expect(highBusynessScenario!.required_personnel_count).toBeCloseTo(51, 1);

    // Verify: 各シナリオの部署配分が定義されていること
    scenarios.forEach((scenario) => {
      expect(scenario.department_allocation).toHaveProperty(
        'appraisal_dept_count'
      );
      expect(scenario.department_allocation).toHaveProperty(
        'support_dept_count'
      );
      expect(scenario.department_allocation.appraisal_dept_count).toBeGreaterThan(
        0
      );
    });

    // Verify: 完了率が100%に近い値であること（高繁忙度シナリオ）
    expect(highBusynessScenario!.expected_completion_rate).toBeGreaterThanOrEqual(
      0.95
    );

    // Verify: コスト見積もりが正の数であること
    scenarios.forEach((scenario) => {
      expect(scenario.cost_estimate).toBeGreaterThan(0);
    });

    // Verify: 複数シナリオの人員配置が異なること（シナリオの多様性を確認）
    const personnel_counts = scenarios.map((s) =>
      s.required_personnel_count
    );
    const unique_counts = new Set(personnel_counts);
    expect(unique_counts.size).toBeGreaterThanOrEqual(2);

    // Verify: シナリオIDが一意であること
    const scenario_ids = scenarios.map((s) => s.scenario_id);
    const unique_ids = new Set(scenario_ids);
    expect(unique_ids.size).toBe(scenarios.length);
  });
});
import { analyzeDivergencePatternRootCause } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1476
  test('should throw error when past project data is insufficient for root cause analysis', () => {
    const insufficient_past_project_data = {
      past_project_count: 5,
      min_required_count: 50,
      region_code: 'JP01',
      work_type_code: 'ARCH',
      analysis_period_months: 3,
    };

    expect(() =>
      analyzeDivergencePatternRootCause(insufficient_past_project_data)
    ).toThrow(/過去案件データが不足/);
  });

  test('should successfully analyze divergence pattern when sufficient past project data exists', () => {
    const sufficient_past_project_data = {
      past_project_count: 150,
      min_required_count: 50,
      region_code: 'JP01',
      work_type_code: 'ARCH',
      analysis_period_months: 3,
      average_divergence_rate: 8.5,
      standard_deviation: 2.3,
      data_collection_start_date: '2024-01-01',
      data_collection_end_date: '2024-03-31',
    };

    const result = analyzeDivergencePatternRootCause(
      sufficient_past_project_data
    );

    expect(result).toEqual({
      analysis_success: true,
      past_project_count: 150,
      average_divergence_rate: 8.5,
      standard_deviation: 2.3,
      root_cause_categories: [
        {
          cause_type: 'learning_data_bias',
          estimated_impact_rate: 0.45,
        },
        {
          cause_type: 'seasonal_variation_unresponsive',
          estimated_impact_rate: 0.35,
        },
        {
          cause_type: 'past_project_data_gap',
          estimated_impact_rate: 0.2,
        },
      ],
      improvement_priority_rank: 'high',
      recommended_action:
        'Add regional and seasonal adjustment data; conduct targeted retraining',
      analysis_timestamp: '2024-03-31T23:59:59Z',
    });
  });

  test('should throw error when past project count equals zero', () => {
    const zero_past_project_data = {
      past_project_count: 0,
      min_required_count: 50,
      region_code: 'JP01',
      work_type_code: 'ARCH',
      analysis_period_months: 3,
    };

    expect(() =>
      analyzeDivergencePatternRootCause(zero_past_project_data)
    ).toThrow(/過去案件データが不足/);
  });

  test('should throw error when minimum required count is not met by narrow margin', () => {
    const barely_insufficient_past_project_data = {
      past_project_count: 49,
      min_required_count: 50,
      region_code: 'JP02',
      work_type_code: 'CIVIL',
      analysis_period_months: 3,
    };

    expect(() =>
      analyzeDivergencePatternRootCause(barely_insufficient_past_project_data)
    ).toThrow(/過去案件データが不足/);
  });

  test('should succeed when past project count exactly meets minimum required count', () => {
    const exactly_sufficient_past_project_data = {
      past_project_count: 50,
      min_required_count: 50,
      region_code: 'JP03',
      work_type_code: 'MECH',
      analysis_period_months: 3,
      average_divergence_rate: 7.2,
      standard_deviation: 1.8,
      data_collection_start_date: '2024-01-01',
      data_collection_end_date: '2024-03-31',
    };

    const result = analyzeDivergencePatternRootCause(
      exactly_sufficient_past_project_data
    );

    expect(result.analysis_success).toBe(true);
    expect(result.past_project_count).toBe(50);
  });

  test('should return detailed root cause breakdown with accurate impact rates', () => {
    const detailed_analysis_input = {
      past_project_count: 200,
      min_required_count: 50,
      region_code: 'JP01',
      work_type_code: 'ARCH',
      analysis_period_months: 12,
      average_divergence_rate: 12.4,
      standard_deviation: 3.1,
      data_collection_start_date: '2023-01-01',
      data_collection_end_date: '2023-12-31',
      divergence_by_season: {
        spring: 9.2,
        summer: 15.3,
        autumn: 10.1,
        winter: 14.9,
      },
    };

    const result = analyzeDivergencePatternRootCause(
      detailed_analysis_input
    );

    expect(result.root_cause_categories).toHaveLength(3);
    expect(result.root_cause_categories[0].cause_type).toBe(
      'learning_data_bias'
    );
    expect(result.root_cause_categories[0].estimated_impact_rate).toBe(0.45);
    expect(result.root_cause_categories[1].cause_type).toBe(
      'seasonal_variation_unresponsive'
    );
    expect(result.root_cause_categories[1].estimated_impact_rate).toBe(0.35);
    expect(result.improvement_priority_rank).toBe('high');
  });
});
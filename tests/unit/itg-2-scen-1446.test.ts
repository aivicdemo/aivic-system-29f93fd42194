import { calculateReadingErrorPriorityScore } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1446
  test('影響範囲が広く重大度が高い誤りが最高優先度スコアを取得する', () => {
    const reading_error_input = {
      impact_scope: 'wide',
      severity_level: 'high',
      affected_estimate_count: 50,
      affected_estimate_amount: 5000000,
    };

    const result = calculateReadingErrorPriorityScore(reading_error_input);

    expect(result.priority_score).toBe(10);
    expect(result.priority_rank).toBe('highest');
    expect(result.impact_scope).toBe('wide');
    expect(result.severity_level).toBe('high');
    expect(result.recommendation).toBe('immediately_address');
    expect(result.estimated_processing_hours).toBe(8);

    const medium_impact_input = {
      impact_scope: 'medium',
      severity_level: 'medium',
      affected_estimate_count: 15,
      affected_estimate_amount: 1500000,
    };

    const medium_result = calculateReadingErrorPriorityScore(medium_impact_input);

    expect(medium_result.priority_score).toBe(5);
    expect(medium_result.priority_rank).toBe('medium');
    expect(medium_result.recommendation).toBe('schedule_within_week');

    const narrow_low_input = {
      impact_scope: 'narrow',
      severity_level: 'low',
      affected_estimate_count: 2,
      affected_estimate_amount: 200000,
    };

    const low_result = calculateReadingErrorPriorityScore(narrow_low_input);

    expect(low_result.priority_score).toBe(1);
    expect(low_result.priority_rank).toBe('lowest');
    expect(low_result.recommendation).toBe('defer_or_batch');

    const edge_case_input = {
      impact_scope: 'wide',
      severity_level: 'high',
      affected_estimate_count: 0,
      affected_estimate_amount: 0,
    };

    expect(() => {
      calculateReadingErrorPriorityScore(edge_case_input);
    }).toThrow(/影響件数/);

    const invalid_scope_input = {
      impact_scope: 'invalid_scope',
      severity_level: 'high',
      affected_estimate_count: 10,
      affected_estimate_amount: 1000000,
    };

    expect(() => {
      calculateReadingErrorPriorityScore(invalid_scope_input);
    }).toThrow(/影響範囲/);

    const invalid_severity_input = {
      impact_scope: 'wide',
      severity_level: 'invalid_severity',
      affected_estimate_count: 10,
      affected_estimate_amount: 1000000,
    };

    expect(() => {
      calculateReadingErrorPriorityScore(invalid_severity_input);
    }).toThrow(/重大度/);
  });
});
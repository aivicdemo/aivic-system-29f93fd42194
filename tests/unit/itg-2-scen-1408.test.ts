import { describe, test, expect } from '@jest/globals';
import { calculateReadingErrorPriority } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1408: [edge] 読取誤り優先度判定機能 - 深刻度スコアが無効値（範囲外）の場合、デフォルト値が適用される
  test('should apply default severity score when input severity score is out of valid range', () => {
    const default_severity_score = 50;
    const valid_min_severity = 0;
    const valid_max_severity = 100;

    // Test case 1: severity score is negative
    const result_negative = calculateReadingErrorPriority({
      severity_score: -1,
      impact_scope_count: 10,
      occurrence_frequency_count: 3,
    });
    expect(result_negative.applied_severity_score).toBe(default_severity_score);
    expect(result_negative.priority_determination_status).toBe('completed');

    // Test case 2: severity score exceeds maximum
    const result_exceeds_max = calculateReadingErrorPriority({
      severity_score: 101,
      impact_scope_count: 10,
      occurrence_frequency_count: 3,
    });
    expect(result_exceeds_max.applied_severity_score).toBe(default_severity_score);
    expect(result_exceeds_max.priority_determination_status).toBe('completed');

    // Test case 3: severity score is null
    const result_null = calculateReadingErrorPriority({
      severity_score: null as unknown as number,
      impact_scope_count: 10,
      occurrence_frequency_count: 3,
    });
    expect(result_null.applied_severity_score).toBe(default_severity_score);
    expect(result_null.priority_determination_status).toBe('completed');

    // Test case 4: severity score is undefined
    const result_undefined = calculateReadingErrorPriority({
      severity_score: undefined as unknown as number,
      impact_scope_count: 10,
      occurrence_frequency_count: 3,
    });
    expect(result_undefined.applied_severity_score).toBe(default_severity_score);
    expect(result_undefined.priority_determination_status).toBe('completed');

    // Test case 5: valid severity score (at lower boundary)
    const result_valid_min = calculateReadingErrorPriority({
      severity_score: valid_min_severity,
      impact_scope_count: 10,
      occurrence_frequency_count: 3,
    });
    expect(result_valid_min.applied_severity_score).toBe(valid_min_severity);
    expect(result_valid_min.priority_determination_status).toBe('completed');

    // Test case 6: valid severity score (at upper boundary)
    const result_valid_max = calculateReadingErrorPriority({
      severity_score: valid_max_severity,
      impact_scope_count: 10,
      occurrence_frequency_count: 3,
    });
    expect(result_valid_max.applied_severity_score).toBe(valid_max_severity);
    expect(result_valid_max.priority_determination_status).toBe('completed');

    // Test case 7: valid severity score (middle value)
    const result_valid_mid = calculateReadingErrorPriority({
      severity_score: 75,
      impact_scope_count: 10,
      occurrence_frequency_count: 3,
    });
    expect(result_valid_mid.applied_severity_score).toBe(75);
    expect(result_valid_mid.priority_determination_status).toBe('completed');

    // Test case 8: priority rank should be calculated correctly with default score
    const result_with_impact = calculateReadingErrorPriority({
      severity_score: 150,
      impact_scope_count: 25,
      occurrence_frequency_count: 5,
    });
    expect(result_with_impact.applied_severity_score).toBe(default_severity_score);
    const priority_score = result_with_impact.priority_score;
    expect(typeof priority_score).toBe('number');
    expect(priority_score).toBeGreaterThanOrEqual(0);
    expect(priority_score).toBeLessThanOrEqual(100);
  });
});
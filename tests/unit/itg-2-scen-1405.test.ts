import { calculateOcrErrorPriority } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 読取誤り優先度判定機能', () => {
  // SCEN-1405
  test('高額案件の誤りが低額案件の誤りより優先度が高く判定される', () => {
    // 高額案件: 査定金額1,000万円以上
    const high_value_error = {
      case_id: 'CASE_HV_001',
      quote_amount: 10000000,
      error_type: 'digit_error',
      error_location: 'amount_field',
      affected_line_count: 1,
      error_impact_score: 85,
    };

    // 低額案件: 査定金額100万円未満
    const low_value_error = {
      case_id: 'CASE_LV_001',
      quote_amount: 500000,
      error_type: 'digit_error',
      error_location: 'amount_field',
      affected_line_count: 1,
      error_impact_score: 85,
    };

    // 高額案件の優先度スコアを計算
    const high_value_priority = calculateOcrErrorPriority(high_value_error);

    // 低額案件の優先度スコアを計算
    const low_value_priority = calculateOcrErrorPriority(low_value_error);

    // 高額案件の優先度スコアが高いことを確認
    expect(high_value_priority.priority_score).toBeGreaterThan(
      low_value_priority.priority_score
    );

    // 具体的な優先度スコアの期待値を検証
    // 高額案件: 基本スコア(85) × 金額係数(1.5) = 127.5 → 128
    expect(high_value_priority.priority_score).toBe(128);

    // 低額案件: 基本スコア(85) × 金額係数(0.8) = 68 → 68
    expect(low_value_priority.priority_score).toBe(68);

    // 高額案件の優先度レベルが高いことを確認
    expect(high_value_priority.priority_level).toBe('high');

    // 低額案件の優先度レベルが適切であることを確認
    expect(low_value_priority.priority_level).toBe('medium');

    // 優先度判定理由に金額が反映されていることを確認
    expect(high_value_priority.reason).toMatch(/高額/);
    expect(low_value_priority.reason).toMatch(/通常/);

    // スコア差異が明確であることを確認
    const score_difference = high_value_priority.priority_score - low_value_priority.priority_score;
    expect(score_difference).toBe(60);
  });
});
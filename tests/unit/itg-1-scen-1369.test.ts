import { describe, test, expect } from '@jest/globals';
import { calculateRequirementPriority } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 要件優先度スコア算出機能', () => {
  // SCEN-1369: [edge] 要件優先度スコア算出機能 - 優先度スコアが閾値境界値（高優先度と中優先度の境界）と一致する場合、スコア値と判定区分が正確に返される
  test('優先度スコアが閾値境界値と一致する場合、スコア値と判定区分が正確に返される', () => {
    // 高優先度と中優先度の境界値は 70.0 と定義
    const boundary_score = 70.0;
    
    // 境界値丁度のスコアを入力
    const result_at_boundary = calculateRequirementPriority({
      score: boundary_score,
    });

    // 返却されたスコア値が入力値と完全に一致することを検証
    expect(result_at_boundary.score).toBe(70.0);
    
    // 返却された判定区分が正確に「高優先度」であることを検証
    expect(result_at_boundary.category).toBe('high');
    
    // スコア値の精度が小数点以下まで正確に保持されることを検証
    expect(result_at_boundary.score).toEqual(70.0);
    
    // 区分判定に曖昧性がないことを確認
    expect(result_at_boundary.category).toMatch(/high/);
  });

  // 高優先度範囲内（境界値より上）のスコアを検証
  test('優先度スコアが高優先度範囲内（70.0超）の場合、判定区分が「高優先度」と返される', () => {
    const high_priority_score = 75.5;
    
    const result_high = calculateRequirementPriority({
      score: high_priority_score,
    });

    expect(result_high.score).toBe(75.5);
    expect(result_high.category).toBe('high');
  });

  // 中優先度範囲内（境界値より下）のスコアを検証
  test('優先度スコアが中優先度範囲内（70.0未満）の場合、判定区分が「中優先度」と返される', () => {
    const medium_priority_score = 65.0;
    
    const result_medium = calculateRequirementPriority({
      score: medium_priority_score,
    });

    expect(result_medium.score).toBe(65.0);
    expect(result_medium.category).toBe('medium');
  });

  // 低優先度範囲のスコアを検証
  test('優先度スコアが低優先度範囲内（40.0未満）の場合、判定区分が「低優先度」と返される', () => {
    const low_priority_score = 35.0;
    
    const result_low = calculateRequirementPriority({
      score: low_priority_score,
    });

    expect(result_low.score).toBe(35.0);
    expect(result_low.category).toBe('low');
  });

  // スコアが有効範囲外（負数）の場合のエラーハンドリング
  test('優先度スコアが負数の場合、スコア範囲エラーが発生する', () => {
    expect(() =>
      calculateRequirementPriority({
        score: -10.0,
      })
    ).toThrow(/スコア/);
  });

  // スコアが有効範囲外（100超）の場合のエラーハンドリング
  test('優先度スコアが100超の場合、スコア範囲エラーが発生する', () => {
    expect(() =>
      calculateRequirementPriority({
        score: 105.0,
      })
    ).toThrow(/スコア/);
  });

  // 小数点精度テスト：中優先度と低優先度の境界値 40.0
  test('優先度スコアが中優先度と低優先度の境界値40.0と一致する場合、判定区分が正確に返される', () => {
    const medium_low_boundary = 40.0;
    
    const result_boundary = calculateRequirementPriority({
      score: medium_low_boundary,
    });

    expect(result_boundary.score).toBe(40.0);
    expect(result_boundary.category).toBe('medium');
  });

  // 小数点を含む高精度スコアの検証
  test('優先度スコアが小数点を含む高精度値の場合、精度が保持される', () => {
    const precise_score = 72.345;
    
    const result_precise = calculateRequirementPriority({
      score: precise_score,
    });

    expect(result_precise.score).toBe(72.345);
    expect(result_precise.category).toBe('high');
  });
});
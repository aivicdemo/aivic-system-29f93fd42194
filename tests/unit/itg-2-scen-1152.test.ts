import { calculatePriorityScore } from '../../src/logic/it-6-2-2-1';

describe('SCEN-1152: 改善優先度スコア算出機能', () => {
  test('SCEN-1152: 影響度スコア60・実装難度スコア40から優先度スコア（0-100）を正しく算出する', () => {
    // 入力値の準備
    const impact_score = 60;
    const implementation_difficulty_score = 40;

    // 優先度スコア算出関数を呼び出す
    const priority_score = calculatePriorityScore(
      impact_score,
      implementation_difficulty_score
    );

    // 戻り値が数値型であることを確認
    expect(typeof priority_score).toBe('number');

    // 戻り値が0以上100以下の範囲内であることを確認
    expect(priority_score).toBeGreaterThanOrEqual(0);
    expect(priority_score).toBeLessThanOrEqual(100);

    // 戻り値が期待値と一致することを確認
    // 計算式: 優先度スコア = (影響度スコア × 0.7 - 実装難度スコア × 0.3)
    // = (60 × 0.7 - 40 × 0.3) = (42 - 12) = 30
    // ただし、スコアが負の場合は0、100を超える場合は100に正規化
    const expected_priority_score = 30;
    expect(priority_score).toBe(expected_priority_score);
  });
});
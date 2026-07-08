import { calculatePriorityScore } from '../../src/logic/it-6-2-1-1';

describe('データ追加更新優先度算出', () => {
  // SCEN-1477
  test('効果度スコアと実装難度スコアから優先度スコアが正しく算出される', () => {
    // 効果度スコア（1-10）が高く実装難度スコア（1-10）が低い場合
    const result_high_effect_low_difficulty = calculatePriorityScore({
      effectiveness_score: 10,
      implementation_difficulty_score: 1,
    });
    expect(result_high_effect_low_difficulty).toBe(95);

    // 効果度スコアが低く実装難度スコアが高い場合
    const result_low_effect_high_difficulty = calculatePriorityScore({
      effectiveness_score: 1,
      implementation_difficulty_score: 10,
    });
    expect(result_low_effect_high_difficulty).toBe(5);

    // 効果度スコア=10、実装難度スコア=5（中程度）
    const result_high_effect_medium_difficulty = calculatePriorityScore({
      effectiveness_score: 10,
      implementation_difficulty_score: 5,
    });
    expect(result_high_effect_medium_difficulty).toBe(75);

    // 効果度スコア=5（中程度）、実装難度スコア=5（中程度）
    const result_medium_effect_medium_difficulty = calculatePriorityScore({
      effectiveness_score: 5,
      implementation_difficulty_score: 5,
    });
    expect(result_medium_effect_medium_difficulty).toBe(50);

    // 効果度スコア=1、実装難度スコア=1
    const result_low_effect_low_difficulty = calculatePriorityScore({
      effectiveness_score: 1,
      implementation_difficulty_score: 1,
    });
    expect(result_low_effect_low_difficulty).toBe(95);

    // 効果度スコア=10、実装難度スコア=10
    const result_high_effect_high_difficulty = calculatePriorityScore({
      effectiveness_score: 10,
      implementation_difficulty_score: 10,
    });
    expect(result_high_effect_high_difficulty).toBe(5);

    // 効果度スコア=8、実装難度スコア=2
    const result_high_effect_low_difficulty_2 = calculatePriorityScore({
      effectiveness_score: 8,
      implementation_difficulty_score: 2,
    });
    expect(result_high_effect_low_difficulty_2).toBe(84);

    // 効果度スコア=3、実装難度スコア=8
    const result_low_effect_high_difficulty_2 = calculatePriorityScore({
      effectiveness_score: 3,
      implementation_difficulty_score: 8,
    });
    expect(result_low_effect_high_difficulty_2).toBe(14);

    // 効果度スコア=5、実装難度スコア=3
    const result_medium_effect_low_difficulty = calculatePriorityScore({
      effectiveness_score: 5,
      implementation_difficulty_score: 3,
    });
    expect(result_medium_effect_low_difficulty).toBe(65);

    // 優先度スコアが0以上100以下の範囲内に収まっていることを検証
    expect(result_high_effect_low_difficulty).toBeGreaterThanOrEqual(0);
    expect(result_high_effect_low_difficulty).toBeLessThanOrEqual(100);

    expect(result_low_effect_high_difficulty).toBeGreaterThanOrEqual(0);
    expect(result_low_effect_high_difficulty).toBeLessThanOrEqual(100);

    expect(result_high_effect_medium_difficulty).toBeGreaterThanOrEqual(0);
    expect(result_high_effect_medium_difficulty).toBeLessThanOrEqual(100);

    expect(result_medium_effect_medium_difficulty).toBeGreaterThanOrEqual(0);
    expect(result_medium_effect_medium_difficulty).toBeLessThanOrEqual(100);

    expect(result_low_effect_low_difficulty).toBeGreaterThanOrEqual(0);
    expect(result_low_effect_low_difficulty).toBeLessThanOrEqual(100);

    expect(result_high_effect_high_difficulty).toBeGreaterThanOrEqual(0);
    expect(result_high_effect_high_difficulty).toBeLessThanOrEqual(100);

    expect(result_high_effect_low_difficulty_2).toBeGreaterThanOrEqual(0);
    expect(result_high_effect_low_difficulty_2).toBeLessThanOrEqual(100);

    expect(result_low_effect_high_difficulty_2).toBeGreaterThanOrEqual(0);
    expect(result_low_effect_high_difficulty_2).toBeLessThanOrEqual(100);

    expect(result_medium_effect_low_difficulty).toBeGreaterThanOrEqual(0);
    expect(result_medium_effect_low_difficulty).toBeLessThanOrEqual(100);

    // 効果度スコアが高いほど優先度スコアが高くなることを検証
    expect(result_high_effect_low_difficulty).toBeGreaterThan(
      result_low_effect_high_difficulty
    );

    // 実装難度スコアが低いほど優先度スコアが高くなることを検証
    expect(result_high_effect_low_difficulty_2).toBeGreaterThan(
      result_low_effect_high_difficulty_2
    );

    // 同じ効果度・難度でも一貫性を確認（同じ入力は同じ出力）
    const result_consistency_1 = calculatePriorityScore({
      effectiveness_score: 5,
      implementation_difficulty_score: 5,
    });
    const result_consistency_2 = calculatePriorityScore({
      effectiveness_score: 5,
      implementation_difficulty_score: 5,
    });
    expect(result_consistency_1).toBe(result_consistency_2);
  });
});
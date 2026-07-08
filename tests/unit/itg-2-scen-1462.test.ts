import { calculatePriorityScore } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード - 優先度スコア算出機能', () => {
  // SCEN-1462: [normal] 優先度スコア算出機能 - 集中度・ビジネス影響度・改善効果期待値から優先度スコアが正確に算出される
  test('should calculate priority score accurately from concentration degree, business impact, and improvement effect expectation', () => {
    // ケース1: 標準的なスコア算出
    // 集中度: 7, ビジネス影響度: 8, 改善効果期待値: 6
    // 優先度スコア = (集中度 * 0.35 + ビジネス影響度 * 0.40 + 改善効果期待値 * 0.25) * 10
    // = (7 * 0.35 + 8 * 0.40 + 6 * 0.25) * 10
    // = (2.45 + 3.2 + 1.5) * 10 = 7.15 * 10 = 71.5
    const result1 = calculatePriorityScore({
      concentrationDegree: 7,
      businessImpactDegree: 8,
      improvementEffectExpectation: 6,
    });
    expect(result1).toBe(71.5);

    // ケース2: 全て最大値のケース
    // 集中度: 10, ビジネス影響度: 10, 改善効果期待値: 10
    // = (10 * 0.35 + 10 * 0.40 + 10 * 0.25) * 10
    // = (3.5 + 4.0 + 2.5) * 10 = 10 * 10 = 100
    const result2 = calculatePriorityScore({
      concentrationDegree: 10,
      businessImpactDegree: 10,
      improvementEffectExpectation: 10,
    });
    expect(result2).toBe(100);

    // ケース3: 全て最小値のケース
    // 集中度: 0, ビジネス影響度: 0, 改善効果期待値: 0
    // = (0 * 0.35 + 0 * 0.40 + 0 * 0.25) * 10 = 0
    const result3 = calculatePriorityScore({
      concentrationDegree: 0,
      businessImpactDegree: 0,
      improvementEffectExpectation: 0,
    });
    expect(result3).toBe(0);

    // ケース4: 集中度が高く、ビジネス影響度が低いケース
    // 集中度: 9, ビジネス影響度: 3, 改善効果期待値: 5
    // = (9 * 0.35 + 3 * 0.40 + 5 * 0.25) * 10
    // = (3.15 + 1.2 + 1.25) * 10 = 5.6 * 10 = 56
    const result4 = calculatePriorityScore({
      concentrationDegree: 9,
      businessImpactDegree: 3,
      improvementEffectExpectation: 5,
    });
    expect(result4).toBe(56);

    // ケース5: ビジネス影響度が高いケース（加重が最大）
    // 集中度: 2, ビジネス影響度: 10, 改善効果期待値: 1
    // = (2 * 0.35 + 10 * 0.40 + 1 * 0.25) * 10
    // = (0.7 + 4.0 + 0.25) * 10 = 4.95 * 10 = 49.5
    const result5 = calculatePriorityScore({
      concentrationDegree: 2,
      businessImpactDegree: 10,
      improvementEffectExpectation: 1,
    });
    expect(result5).toBe(49.5);

    // ケース6: 小数点値のテスト
    // 集中度: 5.5, ビジネス影響度: 6.5, 改善効果期待値: 4.5
    // = (5.5 * 0.35 + 6.5 * 0.40 + 4.5 * 0.25) * 10
    // = (1.925 + 2.6 + 1.125) * 10 = 5.65 * 10 = 56.5
    const result6 = calculatePriorityScore({
      concentrationDegree: 5.5,
      businessImpactDegree: 6.5,
      improvementEffectExpectation: 4.5,
    });
    expect(result6).toBe(56.5);

    // ケース7: 改善効果期待値が高いケース
    // 集中度: 4, ビジネス影響度: 5, 改善効果期待値: 10
    // = (4 * 0.35 + 5 * 0.40 + 10 * 0.25) * 10
    // = (1.4 + 2.0 + 2.5) * 10 = 5.9 * 10 = 59
    const result7 = calculatePriorityScore({
      concentrationDegree: 4,
      businessImpactDegree: 5,
      improvementEffectExpectation: 10,
    });
    expect(result7).toBe(59);

    // ケース8: 境界値 1 の検証
    // 集中度: 1, ビジネス影響度: 1, 改善効果期待値: 1
    // = (1 * 0.35 + 1 * 0.40 + 1 * 0.25) * 10
    // = (0.35 + 0.40 + 0.25) * 10 = 1 * 10 = 10
    const result8 = calculatePriorityScore({
      concentrationDegree: 1,
      businessImpactDegree: 1,
      improvementEffectExpectation: 1,
    });
    expect(result8).toBe(10);

    // すべての結果が数値型であることを確認
    expect(typeof result1).toBe('number');
    expect(typeof result2).toBe('number');
    expect(typeof result3).toBe('number');
    expect(typeof result4).toBe('number');
    expect(typeof result5).toBe('number');
    expect(typeof result6).toBe('number');
    expect(typeof result7).toBe('number');
    expect(typeof result8).toBe('number');

    // すべての結果が定義された範囲内（0-100）にあることを確認
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
    expect(result3).toBeGreaterThanOrEqual(0);
    expect(result3).toBeLessThanOrEqual(100);
    expect(result4).toBeGreaterThanOrEqual(0);
    expect(result4).toBeLessThanOrEqual(100);
    expect(result5).toBeGreaterThanOrEqual(0);
    expect(result5).toBeLessThanOrEqual(100);
    expect(result6).toBeGreaterThanOrEqual(0);
    expect(result6).toBeLessThanOrEqual(100);
    expect(result7).toBeGreaterThanOrEqual(0);
    expect(result7).toBeLessThanOrEqual(100);
    expect(result8).toBeGreaterThanOrEqual(0);
    expect(result8).toBeLessThanOrEqual(100);
  });
});
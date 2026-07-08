import { calculateImprovementPriorityScore } from '../../src/logic/it-6-2-2-1';

describe('改善優先度スコア算出機能', () => {
  test('SCEN-1155: スコア入力値が範囲外（-1または101）の場合、エラーを返す', () => {
    // 前提: 改善優先度スコア算出機能が利用可能な状態
    // 発生条件: スコア入力値に-1を入力してスコア算出処理を実行する
    // 期待結果: 0～100の範囲外であることを示すエラーメッセージが返される

    // ケース 1: 下限値を超過（-1）
    expect(() => {
      calculateImprovementPriorityScore({
        effectScore: -1,
        implementationDifficultyScore: 50,
        riskScore: 30,
      });
    }).toThrow(/スコア|範囲/);

    // ケース 2: 上限値を超過（101）
    expect(() => {
      calculateImprovementPriorityScore({
        effectScore: 101,
        implementationDifficultyScore: 50,
        riskScore: 30,
      });
    }).toThrow(/スコア|範囲/);

    // ケース 3: implementationDifficultyScore が下限値を超過（-1）
    expect(() => {
      calculateImprovementPriorityScore({
        effectScore: 75,
        implementationDifficultyScore: -1,
        riskScore: 30,
      });
    }).toThrow(/スコア|範囲/);

    // ケース 4: implementationDifficultyScore が上限値を超過（101）
    expect(() => {
      calculateImprovementPriorityScore({
        effectScore: 75,
        implementationDifficultyScore: 101,
        riskScore: 30,
      });
    }).toThrow(/スコア|範囲/);

    // ケース 5: riskScore が下限値を超過（-1）
    expect(() => {
      calculateImprovementPriorityScore({
        effectScore: 75,
        implementationDifficultyScore: 50,
        riskScore: -1,
      });
    }).toThrow(/スコア|範囲/);

    // ケース 6: riskScore が上限値を超過（101）
    expect(() => {
      calculateImprovementPriorityScore({
        effectScore: 75,
        implementationDifficultyScore: 50,
        riskScore: 101,
      });
    }).toThrow(/スコア|範囲/);

    // ケース 7: 正常系 - 全スコアが有効範囲内（0～100）
    // 期待値計算: 効果度スコア 80 × 0.5 + (100 - 実装難度スコア 30) × 0.3 + (100 - リスク評価スコア 20) × 0.2
    // = 80 × 0.5 + 70 × 0.3 + 80 × 0.2
    // = 40 + 21 + 16
    // = 77
    const result = calculateImprovementPriorityScore({
      effectScore: 80,
      implementationDifficultyScore: 30,
      riskScore: 20,
    });
    expect(result).toBe(77);

    // ケース 8: 境界値 - 下限（0,0,0）
    // 期待値: 0 × 0.5 + (100 - 0) × 0.3 + (100 - 0) × 0.2
    // = 0 + 30 + 20
    // = 50
    const resultMinBoundary = calculateImprovementPriorityScore({
      effectScore: 0,
      implementationDifficultyScore: 0,
      riskScore: 0,
    });
    expect(resultMinBoundary).toBe(50);

    // ケース 9: 境界値 - 上限（100,100,100）
    // 期待値: 100 × 0.5 + (100 - 100) × 0.3 + (100 - 100) × 0.2
    // = 50 + 0 + 0
    // = 50
    const resultMaxBoundary = calculateImprovementPriorityScore({
      effectScore: 100,
      implementationDifficultyScore: 100,
      riskScore: 100,
    });
    expect(resultMaxBoundary).toBe(50);

    // ケース 10: 中間値（50,50,50）
    // 期待値: 50 × 0.5 + (100 - 50) × 0.3 + (100 - 50) × 0.2
    // = 25 + 15 + 10
    // = 50
    const resultMidpoint = calculateImprovementPriorityScore({
      effectScore: 50,
      implementationDifficultyScore: 50,
      riskScore: 50,
    });
    expect(resultMidpoint).toBe(50);
  });
});
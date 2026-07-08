import { calculateOCRErrorPriority } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1409: 読取誤り優先度判定機能 - 必須パラメータ（深刻度、影響範囲）の欠落時にエラーが返される', () => {
    // Case 1: 深刻度が欠落している場合
    expect(() =>
      calculateOCRErrorPriority({
        severity: '',
        impactScope: 5,
        affectedCount: 10,
        affectedAmount: 150000,
      })
    ).toThrow(/深刻度/);

    // Case 2: 影響範囲が欠落している場合
    expect(() =>
      calculateOCRErrorPriority({
        severity: 'high',
        impactScope: null as any,
        affectedCount: 10,
        affectedAmount: 150000,
      })
    ).toThrow(/影響範囲/);

    // Case 3: 深刻度と影響範囲の両方が欠落している場合
    expect(() =>
      calculateOCRErrorPriority({
        severity: undefined as any,
        impactScope: undefined as any,
        affectedCount: 10,
        affectedAmount: 150000,
      })
    ).toThrow(/深刻度|影響範囲/);

    // Case 4: 正常系 - 必須パラメータが揃っている場合、エラーが発生しない
    const result = calculateOCRErrorPriority({
      severity: 'high',
      impactScope: 5,
      affectedCount: 10,
      affectedAmount: 150000,
    });

    // 優先度スコアが返される (0-100 の範囲)
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // 優先度ランクが返される
    expect(['high', 'medium', 'low']).toContain(result.priorityRank);

    // 対応方針が返される
    expect(typeof result.remediationStrategy).toBe('string');
    expect(result.remediationStrategy.length).toBeGreaterThan(0);
  });
});
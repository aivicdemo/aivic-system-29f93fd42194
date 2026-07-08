import { calculateFeedbackPriorityScore } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1558
  test('フィードバック優先度スコア算出機能 - フィードバック件数がゼロの場合でも関数がnullエラーを発生させない', () => {
    // ハッピーパス: フィードバック件数がゼロの場合、デフォルト値を返す
    const resultWithZeroCount = calculateFeedbackPriorityScore({
      feedbackCount: 0,
      feedbackData: [],
    });
    expect(resultWithZeroCount).toBe(0);

    // ハッピーパス: フィードバックデータが空配列の場合、デフォルト値を返す
    const resultWithEmptyArray = calculateFeedbackPriorityScore({
      feedbackCount: 0,
      feedbackData: [],
    });
    expect(resultWithEmptyArray).toBe(0);

    // ハッピーパス: 正常なフィードバックデータが渡された場合、計算結果を返す
    const resultWithValidData = calculateFeedbackPriorityScore({
      feedbackCount: 5,
      feedbackData: [
        { type: 'dataQuality', severity: 'high', weight: 0.4 },
        { type: 'modelDrift', severity: 'medium', weight: 0.3 },
        { type: 'formatChange', severity: 'low', weight: 0.3 },
      ],
    });
    expect(typeof resultWithValidData).toBe('number');
    expect(resultWithValidData).toBeGreaterThanOrEqual(0);
    expect(resultWithValidData).toBeLessThanOrEqual(100);

    // エラーハンドリング: nullが渡された場合
    expect(() =>
      calculateFeedbackPriorityScore({
        feedbackCount: 0,
        feedbackData: null as any,
      })
    ).toThrow(/フィードバック/);

    // エラーハンドリング: undefinedが渡された場合
    expect(() =>
      calculateFeedbackPriorityScore({
        feedbackCount: 0,
        feedbackData: undefined as any,
      })
    ).toThrow(/フィードバック/);

    // エラーハンドリング: 不正な型が渡された場合
    expect(() =>
      calculateFeedbackPriorityScore({
        feedbackCount: 0,
        feedbackData: 'invalid' as any,
      })
    ).toThrow(/フィードバック/);

    // 境界値テスト: フィードバック件数が負の値の場合
    expect(() =>
      calculateFeedbackPriorityScore({
        feedbackCount: -1,
        feedbackData: [],
      })
    ).toThrow(/件数/);

    // 境界値テスト: フィードバック件数が大きい値の場合でも正常に処理される
    const resultWithLargeCount = calculateFeedbackPriorityScore({
      feedbackCount: 1000,
      feedbackData: Array.from({ length: 1000 }, (_, i) => ({
        type: 'dataQuality',
        severity: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        weight: 1 / 1000,
      })),
    });
    expect(typeof resultWithLargeCount).toBe('number');
    expect(resultWithLargeCount).toBeGreaterThanOrEqual(0);
    expect(resultWithLargeCount).toBeLessThanOrEqual(100);

    // 境界値テスト: フィードバックデータが複数件で異なる重要度の場合
    const resultWithMixedSeverity = calculateFeedbackPriorityScore({
      feedbackCount: 3,
      feedbackData: [
        { type: 'dataQuality', severity: 'high', weight: 0.5 },
        { type: 'modelDrift', severity: 'high', weight: 0.3 },
        { type: 'formatChange', severity: 'low', weight: 0.2 },
      ],
    });
    expect(resultWithMixedSeverity).toBeGreaterThan(50);
    expect(resultWithMixedSeverity).toBeLessThanOrEqual(100);

    // 正常系: 計算式の検証（入力値から期待出力を算出）
    // 優先度スコア = (高重要度フィードバック件数 × 0.5 + 中重要度フィードバック件数 × 0.3 + 低重要度フィードバック件数 × 0.2) × 100 / 合計件数
    const resultFormulaTest = calculateFeedbackPriorityScore({
      feedbackCount: 10,
      feedbackData: [
        { type: 'dataQuality', severity: 'high', weight: 0.5 },
        { type: 'modelDrift', severity: 'medium', weight: 0.3 },
        { type: 'formatChange', severity: 'low', weight: 0.2 },
        { type: 'dataQuality', severity: 'high', weight: 0.5 },
        { type: 'modelDrift', severity: 'medium', weight: 0.3 },
        { type: 'formatChange', severity: 'low', weight: 0.2 },
        { type: 'dataQuality', severity: 'high', weight: 0.5 },
        { type: 'modelDrift', severity: 'high', weight: 0.5 },
        { type: 'formatChange', severity: 'medium', weight: 0.3 },
        { type: 'dataQuality', severity: 'low', weight: 0.2 },
      ],
    });
    // 高(5件) × 0.5 + 中(3件) × 0.3 + 低(2件) × 0.2 = 2.5 + 0.9 + 0.4 = 3.8
    // スコア = (3.8 / 10) × 100 = 38
    expect(resultFormulaTest).toBe(38);
  });
});
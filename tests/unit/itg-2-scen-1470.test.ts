import { determinePriorityScore } from '../../src/logic/it-6-2-2-1';

describe('改善優先度決定機能 - 診断スコア計算エラーハンドリング', () => {
  // SCEN-1470
  test('診断スコア計算不可の場合、エラーを返す', () => {
    const input = {
      diagnosisScoreImpact: NaN,
      diagnosisScoreDifficulty: 75,
      businessImpact: 80,
    };

    expect(() =>
      determinePriorityScore(input)
    ).toThrow(/診断スコア/);
  });

  test('診断スコア計算不可 - 困難度スコア不正の場合、エラーを返す', () => {
    const input = {
      diagnosisScoreImpact: 85,
      diagnosisScoreDifficulty: undefined as any,
      businessImpact: 80,
    };

    expect(() =>
      determinePriorityScore(input)
    ).toThrow(/診断スコア/);
  });

  test('診断スコア計算不可 - 必須入力データ欠落の場合、エラーを返す', () => {
    const input = {
      diagnosisScoreImpact: 85,
      diagnosisScoreDifficulty: 75,
      businessImpact: null as any,
    };

    expect(() =>
      determinePriorityScore(input)
    ).toThrow(/診断スコア/);
  });

  test('診断スコア計算不可 - 全入力がnullの場合、エラーを返す', () => {
    const input = {
      diagnosisScoreImpact: null as any,
      diagnosisScoreDifficulty: null as any,
      businessImpact: null as any,
    };

    expect(() =>
      determinePriorityScore(input)
    ).toThrow(/診断スコア/);
  });

  test('診断スコア計算成功 - 正常な入力で優先度スコアが計算される', () => {
    const input = {
      diagnosisScoreImpact: 85,
      diagnosisScoreDifficulty: 60,
      businessImpact: 80,
    };

    const result = determinePriorityScore(input);

    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('診断スコア計算成功 - 境界値（最大値）での計算', () => {
    const input = {
      diagnosisScoreImpact: 100,
      diagnosisScoreDifficulty: 100,
      businessImpact: 100,
    };

    const result = determinePriorityScore(input);

    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('診断スコア計算成功 - 境界値（最小値）での計算', () => {
    const input = {
      diagnosisScoreImpact: 0,
      diagnosisScoreDifficulty: 0,
      businessImpact: 0,
    };

    const result = determinePriorityScore(input);

    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('診断スコア計算不可 - 負の値を入力した場合、エラーを返す', () => {
    const input = {
      diagnosisScoreImpact: -10,
      diagnosisScoreDifficulty: 75,
      businessImpact: 80,
    };

    expect(() =>
      determinePriorityScore(input)
    ).toThrow(/診断スコア/);
  });

  test('診断スコア計算不可 - 100を超える値を入力した場合、エラーを返す', () => {
    const input = {
      diagnosisScoreImpact: 150,
      diagnosisScoreDifficulty: 75,
      businessImpact: 80,
    };

    expect(() =>
      determinePriorityScore(input)
    ).toThrow(/診断スコア/);
  });

  test('診断スコア計算不可 - 入力オブジェクトが空の場合、エラーを返す', () => {
    const input = {} as any;

    expect(() =>
      determinePriorityScore(input)
    ).toThrow(/診断スコア/);
  });
});
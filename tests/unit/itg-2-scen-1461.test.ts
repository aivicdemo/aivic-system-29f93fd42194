import { calculateConcentrationDegreeScore } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  test('SCEN-1461: 乖離集中度判定・優先度決定機能 - 集中度スコア算出に必要なパラメータが欠落している場合、エラーを返す', () => {
    // 基本的な有効なパラメータセット
    const validParams = {
      assessmentCount: 120,
      deviationRate: 8.5,
      deviationAmount: 450000,
      referenceDataQuality: 0.92,
    };

    // ケース1: assessmentCount が欠落
    const missingAssessmentCount = {
      deviationRate: 8.5,
      deviationAmount: 450000,
      referenceDataQuality: 0.92,
    };
    expect(() =>
      calculateConcentrationDegreeScore(missingAssessmentCount as any)
    ).toThrow(/パラメータ/);

    // ケース2: deviationRate が欠落
    const missingDeviationRate = {
      assessmentCount: 120,
      deviationAmount: 450000,
      referenceDataQuality: 0.92,
    };
    expect(() =>
      calculateConcentrationDegreeScore(missingDeviationRate as any)
    ).toThrow(/パラメータ/);

    // ケース3: deviationAmount が欠落
    const missingDeviationAmount = {
      assessmentCount: 120,
      deviationRate: 8.5,
      referenceDataQuality: 0.92,
    };
    expect(() =>
      calculateConcentrationDegreeScore(missingDeviationAmount as any)
    ).toThrow(/パラメータ/);

    // ケース4: referenceDataQuality が欠落
    const missingReferenceDataQuality = {
      assessmentCount: 120,
      deviationRate: 8.5,
      deviationAmount: 450000,
    };
    expect(() =>
      calculateConcentrationDegreeScore(missingReferenceDataQuality as any)
    ).toThrow(/パラメータ/);

    // ケース5: すべてのパラメータが欠落
    const emptyParams = {};
    expect(() =>
      calculateConcentrationDegreeScore(emptyParams as any)
    ).toThrow(/パラメータ/);

    // ケース6: null が渡された場合
    expect(() =>
      calculateConcentrationDegreeScore(null as any)
    ).toThrow(/パラメータ/);

    // ケース7: undefined が渡された場合
    expect(() =>
      calculateConcentrationDegreeScore(undefined as any)
    ).toThrow(/パラメータ/);

    // 成功ケース: すべてのパラメータが揃っている場合
    const result = calculateConcentrationDegreeScore(validParams);
    expect(result).toEqual({
      concentrationScore: expect.any(Number),
      priorityLevel: expect.stringMatching(/^(高|中|低)$/),
      isValid: true,
    });
    expect(result.concentrationScore).toBeGreaterThanOrEqual(0);
    expect(result.concentrationScore).toBeLessThanOrEqual(100);
  });
});
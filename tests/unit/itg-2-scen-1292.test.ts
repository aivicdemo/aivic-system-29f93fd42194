import { identifyDefectCauseAndPriority } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  test('SCEN-1292: 監視対象データが不完全または空の場合にエラーを返す', () => {
    // ステップ1: 空のオブジェクトを入力
    expect(() => identifyDefectCauseAndPriority({})).toThrow(/監視対象データ/);

    // ステップ2: nullを入力
    expect(() => identifyDefectCauseAndPriority(null)).toThrow(/監視対象データ/);

    // ステップ3: 必須フィールドが欠落したオブジェクトを入力
    const incompleteData = {
      ocrAccuracy: 0.92,
      // aiJudgmentAccuracy欠落
    };
    expect(() => identifyDefectCauseAndPriority(incompleteData)).toThrow(/必須フィールド/);

    // ステップ4: ocrAccuracyのみ欠落
    const missingOcrAccuracy = {
      aiJudgmentAccuracy: 0.88,
      learningDataUpdateFrequency: 1,
      userFeedbackCount: 25,
    };
    expect(() => identifyDefectCauseAndPriority(missingOcrAccuracy)).toThrow(/必須フィールド/);

    // ステップ5: aiJudgmentAccuracyのみ欠落
    const missingAiJudgmentAccuracy = {
      ocrAccuracy: 0.92,
      learningDataUpdateFrequency: 1,
      userFeedbackCount: 25,
    };
    expect(() => identifyDefectCauseAndPriority(missingAiJudgmentAccuracy)).toThrow(/必須フィールド/);

    // ステップ6: learningDataUpdateFrequencyが欠落
    const missingUpdateFrequency = {
      ocrAccuracy: 0.92,
      aiJudgmentAccuracy: 0.88,
      userFeedbackCount: 25,
    };
    expect(() => identifyDefectCauseAndPriority(missingUpdateFrequency)).toThrow(/必須フィールド/);

    // ステップ7: userFeedbackCountが欠落
    const missingFeedbackCount = {
      ocrAccuracy: 0.92,
      aiJudgmentAccuracy: 0.88,
      learningDataUpdateFrequency: 1,
    };
    expect(() => identifyDefectCauseAndPriority(missingFeedbackCount)).toThrow(/必須フィールド/);

    // ステップ8: 正常なデータを入力してエラーが発生しないことを確認
    const validData = {
      ocrAccuracy: 0.92,
      aiJudgmentAccuracy: 0.88,
      learningDataUpdateFrequency: 1,
      userFeedbackCount: 15,
      priorOcrAccuracy: 0.95,
      priorAiJudgmentAccuracy: 0.91,
      evaluationThresholdOcrAccuracy: 0.90,
      evaluationThresholdAiJudgmentAccuracy: 0.85,
      evaluationThresholdUserFeedbackCount: 30,
    };

    const result = identifyDefectCauseAndPriority(validData);

    // 結果が適切なオブジェクト構造を持つことを確認
    expect(result).toHaveProperty('defectCauses');
    expect(result).toHaveProperty('priorityScores');
    expect(result).toHaveProperty('improvements');

    // defectCausesは配列
    expect(Array.isArray(result.defectCauses)).toBe(true);
    expect(result.defectCauses.length).toBeGreaterThan(0);

    // priorityScoresは数値の配列
    expect(Array.isArray(result.priorityScores)).toBe(true);
    result.priorityScores.forEach((score: number) => {
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    // improvementsは配列
    expect(Array.isArray(result.improvements)).toBe(true);

    // 各改善提案にimprovement_idが含まれることを確認
    result.improvements.forEach((improvement: any) => {
      expect(improvement).toHaveProperty('improvement_id');
      expect(typeof improvement.improvement_id).toBe('string');
    });
  });
});
import { describe, test, expect } from '@jest/globals';
import { detectExceptionCaseAndJudgeProcedureBookAddition } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-995: 例外ケース検出と手順書への追加判定 - 発生頻度ゼロの境界値で優先度が正確に判定される', () => {
    const exceptionCase = {
      caseId: 'CASE-2025-001',
      caseDescription: '請求額計算時の割引ルール不適用',
      occurrenceFrequency: 0,
      impactLevel: 'HIGH',
      detectionTimestamp: '2025-01-15T10:30:00Z',
      affectedRecords: 0,
      estimatedManHourToResolve: 2.5,
    };

    const judgmentResult = detectExceptionCaseAndJudgeProcedureBookAddition(exceptionCase);

    expect(judgmentResult).toEqual({
      caseId: 'CASE-2025-001',
      priorityLevel: 'LOW',
      recommendedAction: 'MONITOR',
      shouldAddToProcedureBook: false,
      scoreCalculation: {
        frequencyScore: 0,
        impactScore: 8,
        compositeScore: 0,
        additionThreshold: 15,
      },
      reasoning: 'Occurrence frequency is zero; insufficient basis for procedure addition.',
      validationPassed: true,
    });

    expect(judgmentResult.priorityLevel).toBe('LOW');
    expect(judgmentResult.shouldAddToProcedureBook).toBe(false);
    expect(judgmentResult.scoreCalculation.frequencyScore).toBe(0);
    expect(judgmentResult.scoreCalculation.compositeScore).toBe(0);
    expect(judgmentResult.scoreCalculation.compositeScore).toBeLessThan(
      judgmentResult.scoreCalculation.additionThreshold,
    );
    expect(judgmentResult.validationPassed).toBe(true);
  });
});
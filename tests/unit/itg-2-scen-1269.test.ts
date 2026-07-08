import { validateImprovementEffectVerification } from '../../src/logic/it-6-2-1-1';

describe('改善対策効果検証機能 - 改善後精度が期待改善率に達しなかった場合のエスカレーション判定', () => {
  // SCEN-1269
  test('改善後精度が期待改善率に達しない場合、原因分析と追加対策の要否がエスカレーション判定される', () => {
    const improvementCaseId = 'CASE-2024-001';
    const baselinePrecisionRate = 70;
    const expectedImprovementRate = 15;
    const targetPrecisionRate = baselinePrecisionRate + expectedImprovementRate;
    const postImprovementPrecisionRate = 80;

    const result = validateImprovementEffectVerification({
      caseId: improvementCaseId,
      baselinePrecision: baselinePrecisionRate,
      targetPrecision: targetPrecisionRate,
      actualPrecision: postImprovementPrecisionRate,
      improvementRate: expectedImprovementRate,
      measurementDate: '2024-01-15T10:00:00Z',
      assessorId: 'ASSESSOR-001',
    });

    expect(result.caseId).toBe(improvementCaseId);
    expect(result.baselinePrecision).toBe(70);
    expect(result.targetPrecision).toBe(85);
    expect(result.actualPrecision).toBe(80);
    expect(result.achievementRate).toBe(66.67);
    expect(result.targetAchieved).toBe(false);
    expect(result.requiresRootCauseAnalysis).toBe(true);
    expect(result.rootCauseAnalysisDisplayed).toBe(true);
    expect(result.additionalMeasuresRequired).toBe(true);
    expect(result.requiresEscalation).toBe(true);
    expect(result.escalationStatus).toBe('要追加対策');
    expect(result.escalationNotificationSent).toBe(true);
    expect(result.caseStatus).toBe('エスカレーション中');
    expect(result.caseStatusUpdated).toBe(true);
    expect(result.updateTimestamp).toBe('2024-01-15T10:00:00Z');
  });
});
import { recordAssessmentJudgmentBasis } from '../../src/logic/it-6-3-1';

describe('判定根拠自動記録機能', () => {
  // SCEN-848
  test('適用ロジックが存在しない場合、エラーを返却し記録を中止する', () => {
    const assessmentCaseId = 'CASE-20240115-001';
    const applyLogicId = null;
    const judgedAmount = 5000000;
    const judgedQuantity = 100;
    const deviationRate = 8.5;
    const deviationAmount = 350000;
    const referenceDataCount = 12;
    const correctionFactor = 1.02;
    const judgedBy = 'ASSESSOR-0042';
    const judgedAt = new Date('2024-01-15T11:30:00Z');

    const input = {
      assessmentCaseId,
      applyLogicId,
      judgedAmount,
      judgedQuantity,
      deviationRate,
      deviationAmount,
      referenceDataCount,
      correctionFactor,
      judgedBy,
      judgedAt
    };

    expect(() => recordAssessmentJudgmentBasis(input)).toThrow(/適用ロジック/);
  });
});
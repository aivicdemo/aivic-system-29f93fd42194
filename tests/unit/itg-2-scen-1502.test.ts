import { validateAIJudgmentAccuracy } from '../../src/logic/it-6-2-1-1';

describe('AI判定精度検証機能 - OCR精度が合格基準ちょうどの場合の判定', () => {
  // SCEN-1502
  test('OCR精度99.0%（合格基準のちょうど値）で合格判定となることを検証', () => {
    const ocrAccuracy = 99.0;
    const passingThreshold = 99.0;
    const assessmentId = 'ASSESS-2024-001';
    const assessmentTimestamp = new Date('2024-01-15T10:30:00Z');

    const result = validateAIJudgmentAccuracy({
      ocrAccuracy: ocrAccuracy,
      passingThreshold: passingThreshold,
      assessmentId: assessmentId,
      assessmentTimestamp: assessmentTimestamp
    });

    expect(result.judgmentStatus).toBe('PASS');
    expect(result.ocrAccuracyRecorded).toBe(99.0);
    expect(result.thresholdComparison).toEqual({
      measuredValue: 99.0,
      threshold: 99.0,
      isMeetingStandard: true,
      comparisonResult: 'EQUAL_TO_THRESHOLD'
    });
    expect(result.judgedAt).toEqual(assessmentTimestamp);
    expect(result.assessmentId).toBe('ASSESS-2024-001');
    expect(result.isLogRecorded).toBe(true);
    expect(result.logEntry).toMatchObject({
      assessmentId: 'ASSESS-2024-001',
      ocrAccuracy: 99.0,
      passingThreshold: 99.0,
      judgmentStatus: 'PASS',
      boundaryConditionHandled: true,
      recordedAt: expect.any(String)
    });
  });
});
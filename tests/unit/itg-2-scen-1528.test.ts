import { recordModelImprovementResult } from '../../src/logic/it-6-3-1';

describe('Model Improvement Result Recording - Data Completeness Validation', () => {
  // SCEN-1528
  test('should fail to create variance record when pre-improvement data is missing post-improvement data', () => {
    const incompleteDataset = {
      modelVersionId: 'mv_2024_001',
      improvementPhaseId: 'ip_2024_q1_001',
      preImprovementOcrAccuracy: 78.5,
      preImprovementAiJudgmentAccuracy: 82.3,
      preImprovementMeasurementTimestamp: new Date('2024-01-15T10:00:00Z'),
      postImprovementOcrAccuracy: undefined,
      postImprovementAiJudgmentAccuracy: undefined,
      postImprovementMeasurementTimestamp: undefined,
      learningDataUpdateDetails: {
        pastCaseDataAddedCount: 245,
        priceMasterVersionUpdated: '2024_spring',
        regionalCoverageExpanded: ['hokkaido', 'tohoku'],
        seasonalVariationReflected: true,
      },
      executedBy: 'op_user_001',
      executedAt: new Date('2024-01-20T14:30:00Z'),
    };

    expect(() =>
      recordModelImprovementResult(incompleteDataset)
    ).toThrow(/改善後/);
  });

  test('should fail to create variance record when post-improvement data is present but pre-improvement data is missing', () => {
    const incompleteDataset = {
      modelVersionId: 'mv_2024_002',
      improvementPhaseId: 'ip_2024_q1_002',
      preImprovementOcrAccuracy: undefined,
      preImprovementAiJudgmentAccuracy: undefined,
      preImprovementMeasurementTimestamp: undefined,
      postImprovementOcrAccuracy: 85.2,
      postImprovementAiJudgmentAccuracy: 88.7,
      postImprovementMeasurementTimestamp: new Date('2024-01-25T16:00:00Z'),
      learningDataUpdateDetails: {
        pastCaseDataAddedCount: 180,
        priceMasterVersionUpdated: '2024_spring',
        regionalCoverageExpanded: ['chugoku'],
        seasonalVariationReflected: true,
      },
      executedBy: 'op_user_002',
      executedAt: new Date('2024-01-26T09:15:00Z'),
    };

    expect(() =>
      recordModelImprovementResult(incompleteDataset)
    ).toThrow(/改善前/);
  });

  test('should fail to create variance record when measurement timestamp is missing despite having accuracy values', () => {
    const incompleteDataset = {
      modelVersionId: 'mv_2024_003',
      improvementPhaseId: 'ip_2024_q1_003',
      preImprovementOcrAccuracy: 79.1,
      preImprovementAiJudgmentAccuracy: 83.4,
      preImprovementMeasurementTimestamp: new Date('2024-01-10T08:00:00Z'),
      postImprovementOcrAccuracy: 84.6,
      postImprovementAiJudgmentAccuracy: 87.9,
      postImprovementMeasurementTimestamp: undefined,
      learningDataUpdateDetails: {
        pastCaseDataAddedCount: 320,
        priceMasterVersionUpdated: '2024_spring',
        regionalCoverageExpanded: ['kanto', 'chubu'],
        seasonalVariationReflected: true,
      },
      executedBy: 'op_user_003',
      executedAt: new Date('2024-01-27T11:45:00Z'),
    };

    expect(() =>
      recordModelImprovementResult(incompleteDataset)
    ).toThrow(/測定時刻/);
  });

  test('should succeed and create variance record when all required data is present with correct values', () => {
    const completeDataset = {
      modelVersionId: 'mv_2024_004',
      improvementPhaseId: 'ip_2024_q1_004',
      preImprovementOcrAccuracy: 76.8,
      preImprovementAiJudgmentAccuracy: 81.2,
      preImprovementMeasurementTimestamp: new Date('2024-01-12T09:30:00Z'),
      postImprovementOcrAccuracy: 86.3,
      postImprovementAiJudgmentAccuracy: 89.5,
      postImprovementMeasurementTimestamp: new Date('2024-01-28T14:20:00Z'),
      learningDataUpdateDetails: {
        pastCaseDataAddedCount: 425,
        priceMasterVersionUpdated: '2024_spring',
        regionalCoverageExpanded: ['hokkaido', 'tohoku', 'kanto', 'chubu', 'chugoku'],
        seasonalVariationReflected: true,
      },
      executedBy: 'op_user_004',
      executedAt: new Date('2024-01-29T10:00:00Z'),
    };

    const result = recordModelImprovementResult(completeDataset);

    expect(result).toEqual(
      expect.objectContaining({
        varianceRecordId: expect.any(String),
        ocrAccuracyImprovementRate: 12.5,
        aiJudgmentAccuracyImprovementRate: 10.27,
        recordStatus: 'created',
        isSystemStable: true,
      })
    );
  });

  test('should compute improvement rates correctly with valid pre and post measurements', () => {
    const completeDataset = {
      modelVersionId: 'mv_2024_005',
      improvementPhaseId: 'ip_2024_q1_005',
      preImprovementOcrAccuracy: 75.0,
      preImprovementAiJudgmentAccuracy: 80.0,
      preImprovementMeasurementTimestamp: new Date('2024-01-05T07:00:00Z'),
      postImprovementOcrAccuracy: 82.5,
      postImprovementAiJudgmentAccuracy: 88.0,
      postImprovementMeasurementTimestamp: new Date('2024-01-30T15:30:00Z'),
      learningDataUpdateDetails: {
        pastCaseDataAddedCount: 500,
        priceMasterVersionUpdated: '2024_spring',
        regionalCoverageExpanded: ['all_regions'],
        seasonalVariationReflected: true,
      },
      executedBy: 'op_user_005',
      executedAt: new Date('2024-01-31T12:00:00Z'),
    };

    const result = recordModelImprovementResult(completeDataset);

    expect(result.ocrAccuracyImprovementRate).toBe(10.0);
    expect(result.aiJudgmentAccuracyImprovementRate).toBe(10.0);
    expect(result.recordStatus).toBe('created');
  });

  test('should maintain system stability when error occurs during variance record creation', () => {
    const firstIncompleteDataset = {
      modelVersionId: 'mv_2024_006',
      improvementPhaseId: 'ip_2024_q1_006',
      preImprovementOcrAccuracy: 77.5,
      preImprovementAiJudgmentAccuracy: undefined,
      preImprovementMeasurementTimestamp: new Date('2024-01-11T08:15:00Z'),
      postImprovementOcrAccuracy: 83.0,
      postImprovementAiJudgmentAccuracy: 86.5,
      postImprovementMeasurementTimestamp: new Date('2024-02-01T17:00:00Z'),
      learningDataUpdateDetails: {
        pastCaseDataAddedCount: 280,
        priceMasterVersionUpdated: '2024_spring',
        regionalCoverageExpanded: ['shikoku'],
        seasonalVariationReflected: false,
      },
      executedBy: 'op_user_006',
      executedAt: new Date('2024-02-02T10:30:00Z'),
    };

    expect(() =>
      recordModelImprovementResult(firstIncompleteDataset)
    ).toThrow(/改善前/);

    const secondCompleteDataset = {
      modelVersionId: 'mv_2024_007',
      improvementPhaseId: 'ip_2024_q1_007',
      preImprovementOcrAccuracy: 78.0,
      preImprovementAiJudgmentAccuracy: 82.0,
      preImprovementMeasurementTimestamp: new Date('2024-01-14T09:45:00Z'),
      postImprovementOcrAccuracy: 85.5,
      postImprovementAiJudgmentAccuracy: 89.0,
      postImprovementMeasurementTimestamp: new Date('2024-02-03T16:15:00Z'),
      learningDataUpdateDetails: {
        pastCaseDataAddedCount: 350,
        priceMasterVersionUpdated: '2024_spring',
        regionalCoverageExpanded: ['kyushu'],
        seasonalVariationReflected: true,
      },
      executedBy: 'op_user_007',
      executedAt: new Date('2024-02-04T11:20:00Z'),
    };

    const result = recordModelImprovementResult(secondCompleteDataset);

    expect(result.recordStatus).toBe('created');
    expect(result.isSystemStable).toBe(true);
  });
});
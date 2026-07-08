import { describe, test, expect } from '@jest/globals';
import { aggregateAccuracyByAmountBand } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-894: [edge] 金額帯別の許容乖離幅定義 - 金額帯の境界値（下限・上限の閾値）で正確に区分される
  test('金額帯の下限・上限の閾値において各境界値ちょうどの金額が正確に対応する金額帯に区分され、許容乖離幅が正しく適用される', () => {
    const amountBandDefinitions = [
      {
        bandId: 'band_1',
        bandName: '低額帯',
        lowerLimitYen: 0,
        upperLimitYen: 1000000,
        toleranceDeviationRateLower: -0.05,
        toleranceDeviationRateUpper: 0.05,
      },
      {
        bandId: 'band_2',
        bandName: '中額帯',
        lowerLimitYen: 1000001,
        upperLimitYen: 5000000,
        toleranceDeviationRateLower: -0.08,
        toleranceDeviationRateUpper: 0.08,
      },
      {
        bandId: 'band_3',
        bandName: '高額帯',
        lowerLimitYen: 5000001,
        upperLimitYen: 50000000,
        toleranceDeviationRateLower: -0.10,
        toleranceDeviationRateUpper: 0.10,
      },
    ];

    const assessmentResults = [
      {
        resultId: 'result_1',
        quoteAmountYen: 0,
        assessorId: 'assessor_001',
        constructionTypeId: 'type_A',
        deviationRatePercent: 2.5,
        deviationAmountYen: 0,
      },
      {
        resultId: 'result_2',
        quoteAmountYen: 1000000,
        assessorId: 'assessor_001',
        constructionTypeId: 'type_A',
        deviationRatePercent: 4.8,
        deviationAmountYen: 48000,
      },
      {
        resultId: 'result_3',
        quoteAmountYen: 999999,
        assessorId: 'assessor_001',
        constructionTypeId: 'type_A',
        deviationRatePercent: 3.2,
        deviationAmountYen: 31999,
      },
      {
        resultId: 'result_4',
        quoteAmountYen: 1000001,
        assessorId: 'assessor_002',
        constructionTypeId: 'type_B',
        deviationRatePercent: 6.0,
        deviationAmountYen: 60001,
      },
      {
        resultId: 'result_5',
        quoteAmountYen: 5000000,
        assessorId: 'assessor_002',
        constructionTypeId: 'type_B',
        deviationRatePercent: 7.2,
        deviationAmountYen: 360000,
      },
      {
        resultId: 'result_6',
        quoteAmountYen: 4999999,
        assessorId: 'assessor_002',
        constructionTypeId: 'type_B',
        deviationRatePercent: 5.5,
        deviationAmountYen: 274999,
      },
      {
        resultId: 'result_7',
        quoteAmountYen: 5000001,
        assessorId: 'assessor_003',
        constructionTypeId: 'type_C',
        deviationRatePercent: 8.0,
        deviationAmountYen: 400000,
      },
      {
        resultId: 'result_8',
        quoteAmountYen: 50000000,
        assessorId: 'assessor_003',
        constructionTypeId: 'type_C',
        deviationRatePercent: 9.5,
        deviationAmountYen: 4750000,
      },
      {
        resultId: 'result_9',
        quoteAmountYen: 50000001,
        assessorId: 'assessor_003',
        constructionTypeId: 'type_C',
        deviationRatePercent: 10.2,
        deviationAmountYen: 5100001,
      },
      {
        resultId: 'result_10',
        quoteAmountYen: 2500000,
        assessorId: 'assessor_001',
        constructionTypeId: 'type_B',
        deviationRatePercent: 7.0,
        deviationAmountYen: 175000,
      },
    ];

    const result = aggregateAccuracyByAmountBand(amountBandDefinitions, assessmentResults);

    expect(result).toEqual({
      aggregatedAccuracyMetrics: [
        {
          bandId: 'band_1',
          bandName: '低額帯',
          lowerLimitYen: 0,
          upperLimitYen: 1000000,
          totalAssessmentCount: 3,
          assessmentCountWithinTolerance: 3,
          assessmentCountBeyondTolerance: 0,
          accuracyPercentage: 100.0,
          averageDeviationRatePercent: 3.5,
          assessorAccuracyByAssessor: [
            {
              assessorId: 'assessor_001',
              assessorAccuracyPercentage: 100.0,
              assessmentCountInBand: 3,
              assessmentCountWithinToleranceInBand: 3,
            },
          ],
          constructionTypeAccuracyByType: [
            {
              constructionTypeId: 'type_A',
              constructionTypeAccuracyPercentage: 100.0,
              assessmentCountInBand: 3,
              assessmentCountWithinToleranceInBand: 3,
            },
          ],
        },
        {
          bandId: 'band_2',
          bandName: '中額帯',
          lowerLimitYen: 1000001,
          upperLimitYen: 5000000,
          totalAssessmentCount: 4,
          assessmentCountWithinTolerance: 4,
          assessmentCountBeyondTolerance: 0,
          accuracyPercentage: 100.0,
          averageDeviationRatePercent: 6.425,
          assessorAccuracyByAssessor: [
            {
              assessorId: 'assessor_002',
              assessorAccuracyPercentage: 100.0,
              assessmentCountInBand: 3,
              assessmentCountWithinToleranceInBand: 3,
            },
            {
              assessorId: 'assessor_001',
              assessorAccuracyPercentage: 100.0,
              assessmentCountInBand: 1,
              assessmentCountWithinToleranceInBand: 1,
            },
          ],
          constructionTypeAccuracyByType: [
            {
              constructionTypeId: 'type_B',
              constructionTypeAccuracyPercentage: 100.0,
              assessmentCountInBand: 4,
              assessmentCountWithinToleranceInBand: 4,
            },
          ],
        },
        {
          bandId: 'band_3',
          bandName: '高額帯',
          lowerLimitYen: 5000001,
          upperLimitYen: 50000000,
          totalAssessmentCount: 2,
          assessmentCountWithinTolerance: 2,
          assessmentCountBeyondTolerance: 0,
          accuracyPercentage: 100.0,
          averageDeviationRatePercent: 8.75,
          assessorAccuracyByAssessor: [
            {
              assessorId: 'assessor_003',
              assessorAccuracyPercentage: 100.0,
              assessmentCountInBand: 2,
              assessmentCountWithinToleranceInBand: 2,
            },
          ],
          constructionTypeAccuracyByType: [
            {
              constructionTypeId: 'type_C',
              constructionTypeAccuracyPercentage: 100.0,
              assessmentCountInBand: 2,
              assessmentCountWithinToleranceInBand: 2,
            },
          ],
        },
      ],
      boundaryConditionValidation: {
        lowerBoundaryZeroYenValidated: true,
        lowerBoundaryMinusOneYenValidated: true,
        upperBoundaryExactLimitValidated: true,
        upperBoundaryOnePastLimitValidated: true,
        allBandariesValidated: true,
        bandAssignmentAccuracyPercentage: 100.0,
      },
      dataIntegrityConfirmation: {
        totalRecordsProcessed: 10,
        totalRecordsWithValidBandAssignment: 10,
        totalRecordsWithInvalidBandAssignment: 0,
        dataValidationStatus: 'valid',
      },
    });

    expect(result.aggregatedAccuracyMetrics[0].lowerLimitYen).toBe(0);
    expect(result.aggregatedAccuracyMetrics[0].upperLimitYen).toBe(1000000);
    expect(result.aggregatedAccuracyMetrics[1].lowerLimitYen).toBe(1000001);
    expect(result.aggregatedAccuracyMetrics[1].upperLimitYen).toBe(5000000);
    expect(result.aggregatedAccuracyMetrics[2].lowerLimitYen).toBe(5000001);
    expect(result.aggregatedAccuracyMetrics[2].upperLimitYen).toBe(50000000);

    expect(result.boundaryConditionValidation.lowerBoundaryZeroYenValidated).toBe(true);
    expect(result.boundaryConditionValidation.lowerBoundaryMinusOneYenValidated).toBe(true);
    expect(result.boundaryConditionValidation.upperBoundaryExactLimitValidated).toBe(true);
    expect(result.boundaryConditionValidation.upperBoundaryOnePastLimitValidated).toBe(true);
    expect(result.boundaryConditionValidation.allBandariesValidated).toBe(true);
    expect(result.boundaryConditionValidation.bandAssignmentAccuracyPercentage).toBe(100.0);

    expect(result.dataIntegrityConfirmation.totalRecordsProcessed).toBe(10);
    expect(result.dataIntegrityConfirmation.totalRecordsWithValidBandAssignment).toBe(10);
    expect(result.dataIntegrityConfirmation.totalRecordsWithInvalidBandAssignment).toBe(0);
    expect(result.dataIntegrityConfirmation.dataValidationStatus).toBe('valid');

    expect(result.aggregatedAccuracyMetrics[0].accuracyPercentage).toBe(100.0);
    expect(result.aggregatedAccuracyMetrics[1].accuracyPercentage).toBe(100.0);
    expect(result.aggregatedAccuracyMetrics[2].accuracyPercentage).toBe(100.0);
  });
});
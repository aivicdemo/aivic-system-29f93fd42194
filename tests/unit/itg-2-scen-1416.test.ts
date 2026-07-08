import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  recordCorrectionAndPrepareRelearning,
} from '../../src/logic/it-6-3-1';

describe('Learning Data Correction and Relearning Preparation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1416
  test('should record past project data and price book corrections and transition to relearning-ready state', () => {
    const pastProjectId = 'proj_2024_001';
    const priceBookVersion = 'pb_v2024_q1';
    const correctionReason = 'Market rate adjustment for regional variation';
    
    const pastProjectCorrection = {
      projectId: pastProjectId,
      originalPrice: 1500000,
      correctedPrice: 1620000,
      priceAdjustmentRatio: 1.08,
      propertyDetails: {
        location: 'Tokyo-Minato',
        constructionType: 'commercial',
        area: 1200,
      },
      correctionReason: correctionReason,
      appliedAt: '2024-01-15T10:30:00Z',
    };

    const priceBookCorrection = {
      priceBookVersion: priceBookVersion,
      itemCode: 'ITEM_STEEL_001',
      originalUnitPrice: 85000,
      correctedUnitPrice: 91800,
      correctionFactor: 1.08,
      effectiveFrom: '2024-01-15',
      correctionReason: 'Q1 2024 market adjustment',
    };

    const correctionInput = {
      pastProjectCorrection,
      priceBookCorrection,
      validatedAt: '2024-01-15T10:45:00Z',
      submittedBy: 'user_assessor_001',
    };

    const result = recordCorrectionAndPrepareRelearning(correctionInput);

    // Verify past project correction is recorded
    expect(result.pastProjectCorrectionRecorded).toBe(true);
    expect(result.pastProjectCorrectionId).toMatch(/^corr_proj_/);
    expect(result.pastProjectCorrectionId).toBeTruthy();

    // Verify price book correction is recorded
    expect(result.priceBookCorrectionRecorded).toBe(true);
    expect(result.priceBookCorrectionId).toMatch(/^corr_pb_/);
    expect(result.priceBookCorrectionId).toBeTruthy();

    // Verify correction history log entry
    expect(result.correctionHistoryLogged).toBe(true);
    expect(result.correctionHistoryEntryId).toMatch(/^hist_/);
    expect(result.correctionHistoryEntry).toEqual({
      entryId: expect.stringMatching(/^hist_/),
      correctionTimestamp: '2024-01-15T10:45:00Z',
      correctionType: 'COMBINED_PROJECT_AND_PRICE_BOOK',
      pastProjectCorrectionId: expect.stringMatching(/^corr_proj_/),
      priceBookCorrectionId: expect.stringMatching(/^corr_pb_/),
      correctionReason: correctionReason,
      submittedBy: 'user_assessor_001',
      status: 'LOGGED',
    });

    // Verify learning preparation status transition
    expect(result.learningPreparationStatusTransitioned).toBe(true);
    expect(result.learningPreparationStatus).toBe('RELEARNING_READY');

    // Verify relearning execution readiness
    expect(result.relearningExecutionReady).toBe(true);
    expect(result.relearningExecutionReadinessDetails).toEqual({
      status: 'READY',
      pastProjectDataCount: 1,
      priceBookCorrectionCount: 1,
      totalCorrectionRecords: 2,
      lastCorrectionTimestamp: '2024-01-15T10:45:00Z',
      relearningCanBeExecuted: true,
    });

    // Verify correction metadata integrity
    expect(result.correctionMetadata).toEqual({
      totalPastProjectCorrectionsProcessed: 1,
      totalPriceBookCorrectionsProcessed: 1,
      correctionValidationPassed: true,
      estimatedRelearningDuration: expect.any(Number),
      estimatedRelearningDuration_minutes: expect.greaterThan(0),
    });

    // Verify overall success state
    expect(result.overallSuccess).toBe(true);
    expect(result.readinessForRelearning).toBe(true);
  });
});
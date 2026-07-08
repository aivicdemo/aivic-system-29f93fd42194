import { validateDashboardData } from '../../src/logic/it-1-br-6-2-1';

describe('dashboard display data validation - invalid data detection and error logging', () => {
  test('SCEN-1099: invalid data (negative improvement rate, unreasonable precision values) is detected and excluded with error recorded', () => {
    // Prepare test data with negative improvement rate
    const negativeImprovementData = {
      dashboardRecords: [
        {
          recordId: 'dash-001',
          ocrAccuracy: 85.5,
          aiJudgmentAccuracy: 78.3,
          improvementRate: -5.2,
          timestamp: '2024-01-15T10:00:00Z',
        },
        {
          recordId: 'dash-002',
          ocrAccuracy: 82.0,
          aiJudgmentAccuracy: 80.5,
          improvementRate: 2.1,
          timestamp: '2024-01-15T11:00:00Z',
        },
      ],
    };

    const validationResult = validateDashboardData(negativeImprovementData);

    // Verify negative improvement rate record is excluded
    expect(validationResult.excludedRecords.length).toBeGreaterThan(0);
    expect(validationResult.excludedRecords[0].recordId).toBe('dash-001');
    expect(validationResult.excludedRecords[0].excludeReason).toMatch(/負の改善度/);

    // Prepare test data with unreasonable precision values
    const unreasonablePrecisionData = {
      dashboardRecords: [
        {
          recordId: 'dash-003',
          ocrAccuracy: 150.5,
          aiJudgmentAccuracy: 78.3,
          improvementRate: 3.2,
          timestamp: '2024-01-15T12:00:00Z',
        },
        {
          recordId: 'dash-004',
          ocrAccuracy: 85.0,
          aiJudgmentAccuracy: -20.5,
          improvementRate: 1.5,
          timestamp: '2024-01-15T13:00:00Z',
        },
        {
          recordId: 'dash-005',
          ocrAccuracy: 88.0,
          aiJudgmentAccuracy: 85.0,
          improvementRate: 2.8,
          timestamp: '2024-01-15T14:00:00Z',
        },
      ],
    };

    const precisionValidationResult = validateDashboardData(unreasonablePrecisionData);

    // Verify unreasonable precision values are excluded
    expect(precisionValidationResult.excludedRecords.length).toBe(2);

    // Verify OCR accuracy > 100% is excluded
    const ocrExceededRecord = precisionValidationResult.excludedRecords.find(
      (r) => r.recordId === 'dash-003'
    );
    expect(ocrExceededRecord).toBeDefined();
    expect(ocrExceededRecord?.excludeReason).toMatch(/不合理な精度値/);

    // Verify negative AI judgment accuracy is excluded
    const aiNegativeRecord = precisionValidationResult.excludedRecords.find(
      (r) => r.recordId === 'dash-004'
    );
    expect(aiNegativeRecord).toBeDefined();
    expect(aiNegativeRecord?.excludeReason).toMatch(/不合理な精度値/);

    // Verify remaining data contains only valid record
    expect(precisionValidationResult.remainingRecords.length).toBe(1);
    expect(precisionValidationResult.remainingRecords[0].recordId).toBe('dash-005');
    expect(precisionValidationResult.remainingRecords[0].ocrAccuracy).toBe(88.0);
    expect(precisionValidationResult.remainingRecords[0].aiJudgmentAccuracy).toBe(85.0);
    expect(precisionValidationResult.remainingRecords[0].improvementRate).toBe(2.8);

    // Verify remaining data has only valid values (0-100 for accuracies, any positive for improvement)
    precisionValidationResult.remainingRecords.forEach((record) => {
      expect(record.ocrAccuracy).toBeGreaterThanOrEqual(0);
      expect(record.ocrAccuracy).toBeLessThanOrEqual(100);
      expect(record.aiJudgmentAccuracy).toBeGreaterThanOrEqual(0);
      expect(record.aiJudgmentAccuracy).toBeLessThanOrEqual(100);
      expect(record.improvementRate).toBeGreaterThanOrEqual(0);
    });

    // Verify error logs contain excluded data details
    expect(validationResult.errorLogs.length).toBeGreaterThan(0);
    const errorLog = validationResult.errorLogs[0];
    expect(errorLog.message).toMatch(/検証失敗/);
    expect(errorLog.excludeReason).toBeDefined();
    expect(errorLog.recordId).toBeDefined();
    expect(errorLog.invalidValue).toBeDefined();

    // Verify error log details for negative improvement rate
    const negativeImprovementLog = validationResult.errorLogs.find(
      (log) => log.recordId === 'dash-001'
    );
    expect(negativeImprovementLog).toBeDefined();
    expect(negativeImprovementLog?.invalidValue).toBe(-5.2);

    // Verify error log details for unreasonable precision
    const unreasonablePrecisionLog = validationResult.errorLogs.find(
      (log) => log.recordId === 'dash-003'
    );
    expect(unreasonablePrecisionLog).toBeDefined();
    expect(unreasonablePrecisionLog?.invalidValue).toBe(150.5);

    // Verify error event notification is properly triggered
    expect(validationResult.errorEventNotified).toBe(true);
    expect(validationResult.eventDetails.eventType).toBe('ダッシュボードデータ検証エラー');
    expect(validationResult.eventDetails.totalExcludedCount).toBe(3);
    expect(validationResult.eventDetails.excludedRecordIds).toContain('dash-001');
    expect(validationResult.eventDetails.excludedRecordIds).toContain('dash-003');
    expect(validationResult.eventDetails.excludedRecordIds).toContain('dash-004');
    expect(validationResult.eventDetails.timestamp).toBe(
      validationResult.eventDetails.timestamp
    );

    // Verify validation summary
    expect(validationResult.validationSummary.totalRecordsProcessed).toBe(5);
    expect(validationResult.validationSummary.validRecordsCount).toBe(2);
    expect(validationResult.validationSummary.excludedRecordsCount).toBe(3);
    expect(validationResult.validationSummary.validationStatus).toBe('不正データ検出');
  });
});
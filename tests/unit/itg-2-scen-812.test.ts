import { performModelRetrainingWithPrecisionMeasurement } from "../../src/logic/it-6-2-2-1";

describe("Learning Data Auto-Update & AI Judgment Logic Retraining (SCEN-812)", () => {
  test("SCEN-812: New price master and sample data meet thresholds, retraining executes with precision improvement measurement", () => {
    // Precondition: New price master version and sample data uploaded
    const newPriceMasterVersion = "2024-02-v3";
    const sampleDataRecordCount = 1250;
    const dataQualityScore = 92.5;
    const minimumDataRecordThreshold = 1000;
    const minimumQualityScoreThreshold = 85.0;

    // Verify thresholds are met
    expect(sampleDataRecordCount).toBeGreaterThanOrEqual(minimumDataRecordThreshold);
    expect(dataQualityScore).toBeGreaterThanOrEqual(minimumQualityScoreThreshold);

    // Baseline precision before retraining
    const baselineOcrAccuracy = 87.3;
    const baselineJudgmentAccuracy = 84.6;
    const baselineModelVersion = "2024-01-v2";

    // Trigger retraining process
    const retrainingInput = {
      newPriceMasterVersion,
      sampleDataRecordCount,
      dataQualityScore,
      baselineOcrAccuracy,
      baselineJudgmentAccuracy,
      baselineModelVersion,
    };

    const retrainingResult = performModelRetrainingWithPrecisionMeasurement(
      retrainingInput
    );

    // Assertion 1: Retraining process initiated
    expect(retrainingResult.retrainingInitiated).toBe(true);
    expect(retrainingResult.retrainingStartTimestamp).toBeDefined();

    // Assertion 2: New model version generated
    expect(retrainingResult.newModelVersion).toBeDefined();
    expect(retrainingResult.newModelVersion).not.toBe(baselineModelVersion);
    expect(retrainingResult.newModelVersion).toMatch(/2024-02/);

    // Assertion 3: Retraining completed successfully
    expect(retrainingResult.retrainingCompleted).toBe(true);
    expect(retrainingResult.retrainingCompletionTimestamp).toBeDefined();

    // Assertion 4: Precision improvement measurement executed
    expect(retrainingResult.precisionMeasurementExecuted).toBe(true);

    // Expected precision improvements (structured formula from business rules)
    // Improvement rate: (new - baseline) / baseline * 100
    const expectedOcrAccuracyImprovement = 5.2; // New: 92.0%, Baseline: 87.3%
    const expectedJudgmentAccuracyImprovement = 6.8; // New: 90.3%, Baseline: 84.6%
    const expectedCombinedAccuracyImprovement = 6.0; // Average improvement

    // Assertion 5: Precision metrics recorded
    expect(retrainingResult.precisionMetrics).toBeDefined();
    expect(retrainingResult.precisionMetrics.ocrAccuracyAfterRetraining).toBeCloseTo(
      92.0,
      1
    );
    expect(
      retrainingResult.precisionMetrics.judgmentAccuracyAfterRetraining
    ).toBeCloseTo(90.3, 1);

    // Assertion 6: Improvement degree percentage calculated
    expect(retrainingResult.precisionMetrics.ocrAccuracyImprovementPercent).toBeCloseTo(
      expectedOcrAccuracyImprovement,
      1
    );
    expect(
      retrainingResult.precisionMetrics.judgmentAccuracyImprovementPercent
    ).toBeCloseTo(expectedJudgmentAccuracyImprovement, 1);

    // Assertion 7: Combined improvement degree meets or exceeds minimum threshold (5%)
    const minimumImprovementThreshold = 5.0;
    expect(
      retrainingResult.precisionMetrics.combinedAccuracyImprovementPercent
    ).toBeGreaterThanOrEqual(minimumImprovementThreshold);
    expect(
      retrainingResult.precisionMetrics.combinedAccuracyImprovementPercent
    ).toBeCloseTo(expectedCombinedAccuracyImprovement, 1);

    // Assertion 8: Improvement data recorded in system
    expect(retrainingResult.improvementDataRecorded).toBe(true);
    expect(retrainingResult.modelUpdateBeforePrecision).toEqual({
      ocrAccuracy: baselineOcrAccuracy,
      judgmentAccuracy: baselineJudgmentAccuracy,
      modelVersion: baselineModelVersion,
    });
    expect(retrainingResult.modelUpdateAfterPrecision).toEqual({
      ocrAccuracy: 92.0,
      judgmentAccuracy: 90.3,
      modelVersion: retrainingResult.newModelVersion,
    });

    // Assertion 9: Improvement degree within acceptable range
    expect(
      retrainingResult.precisionMetrics.combinedAccuracyImprovementPercent
    ).toBeLessThan(15.0); // Upper boundary sanity check
    expect(
      retrainingResult.precisionMetrics.combinedAccuracyImprovementPercent
    ).toBeGreaterThan(0);

    // Assertion 10: Model deployment decision based on improvement
    const deploymentThreshold = 5.0;
    expect(retrainingResult.precisionMetrics.combinedAccuracyImprovementPercent).toBeGreaterThanOrEqual(
      deploymentThreshold
    );
    expect(retrainingResult.autoDeploymentToProduction).toBe(true);

    // Assertion 11: New model deployed to production
    expect(retrainingResult.productionDeploymentCompleted).toBe(true);
    expect(retrainingResult.productionDeploymentTimestamp).toBeDefined();
    expect(retrainingResult.activeModelVersionInProduction).toBe(
      retrainingResult.newModelVersion
    );

    // Assertion 12: Complete audit trail recorded
    expect(retrainingResult.auditTrail).toBeDefined();
    expect(retrainingResult.auditTrail.retrainingTriggeredBy).toBeDefined();
    expect(retrainingResult.auditTrail.dataSourceVersion).toBe(
      newPriceMasterVersion
    );
    expect(retrainingResult.auditTrail.sampleSize).toBe(sampleDataRecordCount);
    expect(retrainingResult.auditTrail.qualityMetric).toBe(dataQualityScore);
  });
});
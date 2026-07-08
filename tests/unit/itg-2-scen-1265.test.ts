import { describe, test, expect } from "@jest/globals";
import {
  adjustProcessingQueueUnderHighLoad,
  recordQueueAdjustmentLog,
  monitorAssessmentQualityMetrics,
  verifyImprovementImplementationProgress,
  compareQualityMetricsBeforeAfter,
} from "../../src/logic/it-6-3-1";

describe("IT-6-3-1: Processing Queue Auto-Adjustment During Improvement Implementation", () => {
  test("SCEN-1265: Auto-adjust processing queue when assessment volume doubles during improvement implementation to maintain quality standards", () => {
    // ===== Initial State: Improvement Implementation Active =====
    const improvementImplementationState = {
      status: "in_progress",
      startTime: new Date("2024-12-01T09:00:00Z"),
      targetMetrics: {
        ocrAccuracy: 92,
        judgeAccuracy: 89,
        maxErrorRate: 2.5,
        minQualityScore: 85,
      },
    };

    // ===== Initial Queue State =====
    const baselineQueueState = {
      queueCount: 45,
      prioritySettings: {
        critical: 3,
        high: 2,
        normal: 1,
      },
      batchSize: 10,
      parallelProcessCount: 4,
      processingSpeedSecondsPerItem: 8,
    };

    // ===== Simulate 2x Assessment Volume Load =====
    const highLoadSimulation = {
      normalDailyVolume: 45,
      simulatedVolume: 95, // > 2x
      volumeIncreaseRatio: 2.11,
      timestamp: new Date("2024-12-01T14:30:00Z"),
    };

    // ===== Expected Queue Adjustment Parameters =====
    const expectedAdjustment = {
      adjustedQueueCount: 95,
      adjustedPrioritySettings: {
        critical: 5,
        high: 3,
        normal: 1,
      },
      adjustedBatchSize: 5, // Reduced from 10 to reduce memory pressure
      adjustedParallelProcessCount: 3, // Reduced from 4 to prevent quality degradation
      dynamicProcessingSpeedSecondsPerItem: 6, // Optimized from 8
      queueAdjustmentReason: "High load detected - priority rebalancing and batch reduction to maintain quality",
    };

    // ===== Execute Queue Adjustment =====
    const adjustmentResult = adjustProcessingQueueUnderHighLoad({
      currentQueueState: baselineQueueState,
      simulatedVolume: highLoadSimulation.simulatedVolume,
      improvementImplementationState,
      targetQualityThresholds: improvementImplementationState.targetMetrics,
      timestamp: highLoadSimulation.timestamp,
    });

    // ===== Verify Adjustment Execution =====
    expect(adjustmentResult.adjusted).toBe(true);
    expect(adjustmentResult.newQueueCount).toBe(expectedAdjustment.adjustedQueueCount);
    expect(adjustmentResult.newPrioritySettings.critical).toBe(
      expectedAdjustment.adjustedPrioritySettings.critical
    );
    expect(adjustmentResult.newPrioritySettings.high).toBe(
      expectedAdjustment.adjustedPrioritySettings.high
    );
    expect(adjustmentResult.newBatchSize).toBe(expectedAdjustment.adjustedBatchSize);
    expect(adjustmentResult.newParallelProcessCount).toBe(
      expectedAdjustment.adjustedParallelProcessCount
    );
    expect(adjustmentResult.optimizedProcessingSpeedSecondsPerItem).toBe(
      expectedAdjustment.dynamicProcessingSpeedSecondsPerItem
    );

    // ===== Record Queue Adjustment Log =====
    const adjustmentLogRecord = recordQueueAdjustmentLog({
      adjustmentId: "qa_20241201_143000_001",
      timestamp: highLoadSimulation.timestamp,
      reason: expectedAdjustment.queueAdjustmentReason,
      beforeState: baselineQueueState,
      afterState: {
        queueCount: expectedAdjustment.adjustedQueueCount,
        prioritySettings: expectedAdjustment.adjustedPrioritySettings,
        batchSize: expectedAdjustment.adjustedBatchSize,
        parallelProcessCount: expectedAdjustment.adjustedParallelProcessCount,
      },
      volumeMetrics: {
        normalVolume: highLoadSimulation.normalDailyVolume,
        simulatedVolume: highLoadSimulation.simulatedVolume,
        increaseRatio: highLoadSimulation.volumeIncreaseRatio,
      },
      improvementImplementationId: "imp_20241201_090000_001",
    });

    expect(adjustmentLogRecord.recorded).toBe(true);
    expect(adjustmentLogRecord.logId).toMatch(/qa_20241201_143000_001/);
    expect(adjustmentLogRecord.batchSizeReduction).toBe(50); // (10-5)/10 * 100 = 50%
    expect(adjustmentLogRecord.parallelProcessReduction).toBe(25); // (4-3)/4 * 100 = 25%

    // ===== Monitor Quality Metrics Post-Adjustment =====
    const qualityMonitoring = monitorAssessmentQualityMetrics({
      assessmentSampleSize: 50,
      samplingPeriodMinutes: 30,
      measurementTimestamp: new Date("2024-12-01T15:00:00Z"),
      improvementImplementationActive: true,
    });

    expect(qualityMonitoring.errorRate).toBeLessThanOrEqual(
      improvementImplementationState.targetMetrics.maxErrorRate
    );
    expect(qualityMonitoring.qualityScore).toBeGreaterThanOrEqual(
      improvementImplementationState.targetMetrics.minQualityScore
    );
    expect(qualityMonitoring.qualityMaintained).toBe(true);
    expect(qualityMonitoring.metricsCollected).toBe(50);
    expect(qualityMonitoring.monitoringDurationSeconds).toBe(1800);

    // Specific quality metric values based on scenario
    expect(qualityMonitoring.errorRate).toBe(1.8); // Below 2.5% threshold
    expect(qualityMonitoring.qualityScore).toBe(87.5); // Above 85 threshold
    expect(qualityMonitoring.averageProcessingTimeSeconds).toBe(6.2); // Optimized from 8
    expect(qualityMonitoring.ocrReadAccuracy).toBe(93.2); // Above 92% target
    expect(qualityMonitoring.marketJudgmentAccuracy).toBe(90.1); // Above 89% target

    // ===== Verify Improvement Implementation Progress =====
    const improvementProgress = verifyImprovementImplementationProgress({
      improvementImplementationId: "imp_20241201_090000_001",
      checkTimestamp: new Date("2024-12-01T15:30:00Z"),
    });

    expect(improvementProgress.status).toBe("in_progress");
    expect(improvementProgress.implementedCount).toBe(3); // 3 of 5 target improvements implemented
    expect(improvementProgress.totalTargetCount).toBe(5);
    expect(improvementProgress.progressPercentage).toBe(60);
    expect(improvementProgress.impactOnQualityMetrics).toEqual({
      ocrAccuracyImprovement: 1.2,
      marketJudgmentAccuracyImprovement: 0.8,
      processingTimeReductionPercent: 22.5,
    });

    // ===== Compare Quality Metrics Before and After Adjustment =====
    const beforeAdjustmentMetrics = {
      errorRate: 3.2,
      qualityScore: 81.5,
      averageProcessingTimeSeconds: 9.5,
      throughputItemsPerHour: 380,
      ocrReadAccuracy: 90.8,
      marketJudgmentAccuracy: 88.2,
      measurementTimestamp: new Date("2024-12-01T14:00:00Z"),
    };

    const afterAdjustmentMetrics = {
      errorRate: 1.8,
      qualityScore: 87.5,
      averageProcessingTimeSeconds: 6.2,
      throughputItemsPerHour: 580,
      ocrReadAccuracy: 93.2,
      marketJudgmentAccuracy: 90.1,
      measurementTimestamp: new Date("2024-12-01T15:30:00Z"),
    };

    const metricsComparison = compareQualityMetricsBeforeAfter({
      beforeMetrics: beforeAdjustmentMetrics,
      afterMetrics: afterAdjustmentMetrics,
      improvementImplementationActive: true,
      assessmentVolumeUnderHighLoad: true,
    });

    expect(metricsComparison.errorRateImprovement).toBe(-43.75); // (1.8-3.2)/3.2 * 100 = -43.75%
    expect(metricsComparison.qualityScoreImprovement).toBe(7.36); // (87.5-81.5)/81.5 * 100 = 7.36%
    expect(metricsComparison.processingTimeReductionPercent).toBe(-34.74); // (6.2-9.5)/9.5 * 100 = -34.74%
    expect(metricsComparison.throughputIncreasePercent).toBe(52.63); // (580-380)/380 * 100 = 52.63%
    expect(metricsComparison.ocrReadAccuracyGain).toBe(2.4); // 93.2 - 90.8
    expect(metricsComparison.marketJudgmentAccuracyGain).toBe(1.9); // 90.1 - 88.2
    expect(metricsComparison.qualityMaintainedDuringHighLoad).toBe(true);
    expect(metricsComparison.riskMitigated).toBe(true);

    // ===== Final Verification: Queue Adjustment Log Completeness =====
    expect(adjustmentLogRecord).toHaveProperty("adjustmentId");
    expect(adjustmentLogRecord).toHaveProperty("timestamp");
    expect(adjustmentLogRecord).toHaveProperty("reason");
    expect(adjustmentLogRecord).toHaveProperty("beforeState");
    expect(adjustmentLogRecord).toHaveProperty("afterState");
    expect(adjustmentLogRecord).toHaveProperty("volumeMetrics");
    expect(adjustmentLogRecord).toHaveProperty("improvementImplementationId");
    expect(adjustmentLogRecord.logRecorded).toBe(true);

    // ===== System Stability Confirmation =====
    expect(adjustmentResult.systemStable).toBe(true);
    expect(qualityMonitoring.qualityMaintained).toBe(true);
    expect(metricsComparison.qualityMaintainedDuringHighLoad).toBe(true);
    expect(metricsComparison.riskMitigated).toBe(true);
  });
});
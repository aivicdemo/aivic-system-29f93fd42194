import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  extractROIMetricsFromInitialOperation,
  calculateScalingFactorFor700Staff,
  validateInvestmentJustification,
} from "../../src/logic/it-6-2-1-1";

const fetchMock = require("jest-fetch-mock");

describe("ROI実績レポート自動抽出 - 700名規模展開投資根拠生成", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1324
  test("should automatically extract ROI metrics from initial 30-staff operation and generate investment justification for 700-staff scaling", () => {
    // ===== Setup: 初期30名運用の3ヶ月実績データ =====
    const initialOperationMetrics = {
      operationPeriodMonths: 3,
      staffCount: 30,
      processTimeReductionRate: 38.5,
      qualityUniformityIndex: 82.3,
      systemAvailabilityRate: 98.7,
      ocrAccuracy: 94.2,
      aiJudgmentAccuracy: 91.5,
      monthlyQuotaProcessed: 4950,
      averageProcessTimePerQuoteMinutes: 12.4,
      incidentCount: 2,
      feedbackCountPositive: 187,
      feedbackCountNegative: 12,
    };

    const targetScalingStaffCount = 700;
    const performanceExtrapolationCoefficient = 0.92;
    const accuracyDegradationFactorForScaling = 0.88;

    // ===== Phase 1: 初期30名運用の処理時間短縮率を確認 =====
    expect(initialOperationMetrics.processTimeReductionRate).toBe(38.5);

    // ===== Phase 2: 品質均一化指標データを確認 =====
    expect(initialOperationMetrics.qualityUniformityIndex).toBe(82.3);

    // ===== Phase 3: 稼働率データを確認 =====
    expect(initialOperationMetrics.systemAvailabilityRate).toBe(98.7);

    // ===== Phase 4: 700名規模展開への推計値を計算 =====
    // 処理時間短縮率は規模拡大により若干低下すると仮定（係数 0.92 適用）
    const projectedProcessTimeReductionFor700Staff =
      initialOperationMetrics.processTimeReductionRate *
      performanceExtrapolationCoefficient;
    expect(projectedProcessTimeReductionFor700Staff).toBeCloseTo(35.42, 1);

    // 品質均一化指標は規模拡大により低下（係数 0.88 適用）
    const projectedQualityUniformityIndexFor700Staff =
      initialOperationMetrics.qualityUniformityIndex *
      accuracyDegradationFactorForScaling;
    expect(projectedQualityUniformityIndexFor700Staff).toBeCloseTo(72.424, 2);

    // 稼働率は規模拡大でも維持可能と仮定（係数 0.99 適用）
    const projectedSystemAvailabilityRateFor700Staff =
      initialOperationMetrics.systemAvailabilityRate * 0.99;
    expect(projectedSystemAvailabilityRateFor700Staff).toBeCloseTo(97.713, 2);

    // ===== Phase 5: OCR精度とAI判定精度の規模拡大後推計値 =====
    const projectedOcrAccuracyFor700Staff =
      initialOperationMetrics.ocrAccuracy * accuracyDegradationFactorForScaling;
    expect(projectedOcrAccuracyFor700Staff).toBeCloseTo(82.896, 2);

    const projectedAiJudgmentAccuracyFor700Staff =
      initialOperationMetrics.aiJudgmentAccuracy *
      accuracyDegradationFactorForScaling;
    expect(projectedAiJudgmentAccuracyFor700Staff).toBeCloseTo(80.52, 2);

    // ===== Phase 6: 月間処理能力の規模拡大推計 =====
    // 初期30名で月4,950件 → 700名での推計は線形スケーリングに係数を適用
    const scalingFactor = targetScalingStaffCount / initialOperationMetrics.staffCount;
    const baseMonthlyCapacityFor700Staff =
      initialOperationMetrics.monthlyQuotaProcessed * scalingFactor;
    const projectedMonthlyCapacityFor700Staff =
      baseMonthlyCapacityFor700Staff *
      performanceExtrapolationCoefficient;
    expect(projectedMonthlyCapacityFor700Staff).toBeCloseTo(115720.5, 0);

    // ===== Phase 7: 投資根拠レポートを自動抽出 =====
    const roiExtractionResult = extractROIMetricsFromInitialOperation({
      initialMetrics: initialOperationMetrics,
      targetStaffCount: targetScalingStaffCount,
      performanceExtrapolationCoefficient: performanceExtrapolationCoefficient,
      accuracyDegradationFactor: accuracyDegradationFactorForScaling,
    });

    expect(roiExtractionResult).toEqual({
      extractionStatus: "SUCCESS",
      metricsExtracted: {
        processTimeReductionRate: 38.5,
        qualityUniformityIndex: 82.3,
        systemAvailabilityRate: 98.7,
      },
      projectionMetricsFor700Staff: {
        projectedProcessTimeReductionRate: expect.closeTo(35.42, 1),
        projectedQualityUniformityIndex: expect.closeTo(72.424, 2),
        projectedSystemAvailabilityRate: expect.closeTo(97.713, 2),
        projectedOcrAccuracy: expect.closeTo(82.896, 2),
        projectedAiJudgmentAccuracy: expect.closeTo(80.52, 2),
      },
      scalingAnalysis: {
        initialStaffCount: 30,
        targetStaffCount: 700,
        scalingFactor: expect.closeTo(23.333, 2),
        projectedMonthlyCapacityPerStaff: expect.closeTo(165.315, 2),
        projectedTotalMonthlyCapacity: expect.closeTo(115720.5, 0),
      },
      dataQualityMetrics: {
        ocrAccuracyInitial: 94.2,
        aiJudgmentAccuracyInitial: 91.5,
        dataCompleteness: 100,
        dataValidityScore: 98.5,
      },
    });

    // ===== Phase 8: スケーリング係数の詳細計算 =====
    const scalingCalculation = calculateScalingFactorFor700Staff({
      initialStaffCount: initialOperationMetrics.staffCount,
      targetStaffCount: targetScalingStaffCount,
      initialProcessTimeReductionRate:
        initialOperationMetrics.processTimeReductionRate,
      performanceExtrapolationCoefficient: performanceExtrapolationCoefficient,
      qualityDegradationRiskFactor: 0.12,
    });

    expect(scalingCalculation).toEqual({
      scalingFactor: expect.closeTo(23.333, 2),
      adjustedPerformanceFactor: expect.closeTo(0.92, 2),
      qualityRiskAdjustment: expect.closeTo(0.88, 2),
      capacityMultiplier: expect.closeTo(21.453, 2),
      recommendedPhaseCount: 3,
      estimatedTimeToFullScale: 9,
    });

    // ===== Phase 9: 投資根拠の妥当性判定 =====
    const investmentJustificationValidation =
      validateInvestmentJustification({
        projectedProcessTimeReductionRate: 35.42,
        projectedQualityUniformityIndex: 72.424,
        projectedSystemAvailabilityRate: 97.713,
        projectedMonthlyCapacity: 115720.5,
        minimumAcceptableProcessTimeReduction: 30.0,
        minimumAcceptableQualityIndex: 70.0,
        minimumAcceptableAvailabilityRate: 95.0,
        roiThresholdMonths: 12,
        investmentAmountMillionYen: 45.8,
      });

    expect(investmentJustificationValidation).toEqual({
      validationStatus: "APPROVED",
      processTimeReductionMeetsRequirement: true,
      qualityUniformityMeetsRequirement: true,
      availabilityRateMeetsRequirement: true,
      capacityProjectionRealistic: true,
      overallJustificationValid: true,
      confidenceScore: expect.closeTo(87.3, 1),
      recommendedDecision: "GO_TO_INVESTMENT",
      riskAssessment: {
        accuracyDegradationRisk: "MEDIUM",
        scalingChallengeRisk: "LOW",
        operationalReadinessRisk: "MEDIUM",
        dataPreparationRisk: "LOW",
      },
      conditionalRecommendations: [
        "Implement phased rollout (3 phases over 9 months)",
        "Establish continuous learning data update schedule",
        "Deploy enhanced monitoring for accuracy degradation zones",
      ],
    });

    // ===== Phase 10: レポート内容の数値検証 =====
    expect(investmentJustificationValidation.projectedProcessTimeReduction).toBeCloseTo(35.42, 1);
    expect(investmentJustificationValidation.projectedQualityMetric).toBeCloseTo(72.424, 2);
    expect(investmentJustificationValidation.projectedAvailability).toBeCloseTo(97.713, 2);

    // ===== Phase 11: エクスポート形式の検証 =====
    fetchMock.mockResponseOnce(
      JSON.stringify({
        reportId: "ROI-2024-001",
        generatedAt: "2024-02-01T14:30:00Z",
        fileName: "ROI_Investment_Justification_700Staff.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSizeBytes: 245632,
        dataSheetCount: 5,
        exportStatus: "READY",
      }),
      { status: 200 }
    );

    const exportRequest = {
      reportId: "ROI-2024-001",
      format: "EXCEL",
      includeCharts: true,
      includeDetailedMetrics: true,
      includeRiskAnalysis: true,
    };

    return fetch("/api/v1/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exportRequest),
    })
      .then((response) => {
        expect(response.status).toBe(200);
        return response.json();
      })
      .then((exportResult) => {
        expect(exportResult.reportId).toBe("ROI-2024-001");
        expect(exportResult.fileName).toContain("ROI_Investment");
        expect(exportResult.contentType).toBe(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        expect(exportResult.dataSheetCount).toBe(5);
        expect(exportResult.exportStatus).toBe("READY");
        expect(exportResult.fileSizeBytes).toBeGreaterThan(200000);
      });
  });
});
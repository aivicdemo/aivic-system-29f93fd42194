import { describe, test, expect } from "@jest/globals";
import { validateModificationApprovalCriteria } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1424: [error] 修正内容承認基準判定機能 - OCR精度は合格だがAI判定精度が承認基準を下回る場合に承認不可と判定される
  test("should reject modification when OCR precision passes but AI judgment precision falls below approval standard", () => {
    const modificationContent = {
      ocrPrecision: 95.5,
      aiJudgmentPrecision: 85.0,
      processingTimeReduction: 12.5,
      qualityUniformityIndex: 0.88,
      modificationDate: "2024-03-15T10:30:00Z",
      modifierId: "usr_mod_001",
      targetRegions: ["Tokyo", "Osaka"],
      targetConstructionTypes: ["Renovation", "NewBuild"],
      targetAmountRanges: ["1M-5M", "5M-10M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    const result = validateModificationApprovalCriteria(
      modificationContent,
      approvalCriteria
    );

    expect(result.approvalStatus).toBe("REJECTED");
    expect(result.isApproved).toBe(false);
    expect(result.rejectionReasons).toContain("AI判定精度");
    expect(result.ocrPrecisionStatus).toBe("PASSED");
    expect(result.aiJudgmentPrecisionStatus).toBe("FAILED");
    expect(result.ocrPrecisionStatus !== result.aiJudgmentPrecisionStatus).toBe(
      true
    );
  });

  test("should approve modification when all criteria including AI judgment precision meet approval standards", () => {
    const modificationContent = {
      ocrPrecision: 96.2,
      aiJudgmentPrecision: 92.5,
      processingTimeReduction: 15.3,
      qualityUniformityIndex: 0.91,
      modificationDate: "2024-03-15T10:30:00Z",
      modifierId: "usr_mod_001",
      targetRegions: ["Tokyo"],
      targetConstructionTypes: ["Renovation"],
      targetAmountRanges: ["1M-5M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    const result = validateModificationApprovalCriteria(
      modificationContent,
      approvalCriteria
    );

    expect(result.approvalStatus).toBe("APPROVED");
    expect(result.isApproved).toBe(true);
    expect(result.rejectionReasons).toHaveLength(0);
    expect(result.ocrPrecisionStatus).toBe("PASSED");
    expect(result.aiJudgmentPrecisionStatus).toBe("PASSED");
  });

  test("should reject modification with detailed reason when AI precision exactly equals failure threshold", () => {
    const modificationContent = {
      ocrPrecision: 97.0,
      aiJudgmentPrecision: 89.99,
      processingTimeReduction: 18.0,
      qualityUniformityIndex: 0.92,
      modificationDate: "2024-03-15T11:45:00Z",
      modifierId: "usr_mod_002",
      targetRegions: ["Kyoto"],
      targetConstructionTypes: ["NewBuild"],
      targetAmountRanges: ["5M-10M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    const result = validateModificationApprovalCriteria(
      modificationContent,
      approvalCriteria
    );

    expect(result.approvalStatus).toBe("REJECTED");
    expect(result.isApproved).toBe(false);
    expect(result.aiJudgmentPrecisionStatus).toBe("FAILED");
    expect(result.failureThreshold.aiJudgmentPrecision).toBe(90.0);
    expect(result.actualValue.aiJudgmentPrecision).toBe(89.99);
  });

  test("should throw error when OCR precision is negative or invalid", () => {
    const modificationContent = {
      ocrPrecision: -5.0,
      aiJudgmentPrecision: 92.0,
      processingTimeReduction: 10.0,
      qualityUniformityIndex: 0.88,
      modificationDate: "2024-03-15T10:30:00Z",
      modifierId: "usr_mod_003",
      targetRegions: ["Tokyo"],
      targetConstructionTypes: ["Renovation"],
      targetAmountRanges: ["1M-5M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    expect(() =>
      validateModificationApprovalCriteria(modificationContent, approvalCriteria)
    ).toThrow(/OCR精度/);
  });

  test("should throw error when AI judgment precision exceeds 100 percent", () => {
    const modificationContent = {
      ocrPrecision: 96.0,
      aiJudgmentPrecision: 105.5,
      processingTimeReduction: 10.0,
      qualityUniformityIndex: 0.88,
      modificationDate: "2024-03-15T10:30:00Z",
      modifierId: "usr_mod_004",
      targetRegions: ["Osaka"],
      targetConstructionTypes: ["Renovation"],
      targetAmountRanges: ["5M-10M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    expect(() =>
      validateModificationApprovalCriteria(modificationContent, approvalCriteria)
    ).toThrow(/AI判定精度/);
  });

  test("should reject modification when multiple criteria fail including AI judgment precision", () => {
    const modificationContent = {
      ocrPrecision: 94.0,
      aiJudgmentPrecision: 85.0,
      processingTimeReduction: 3.0,
      qualityUniformityIndex: 0.80,
      modificationDate: "2024-03-15T14:20:00Z",
      modifierId: "usr_mod_005",
      targetRegions: ["Hokkaido"],
      targetConstructionTypes: ["Repair"],
      targetAmountRanges: ["500K-1M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    const result = validateModificationApprovalCriteria(
      modificationContent,
      approvalCriteria
    );

    expect(result.approvalStatus).toBe("REJECTED");
    expect(result.isApproved).toBe(false);
    expect(result.rejectionReasons.length).toBeGreaterThanOrEqual(3);
    expect(result.rejectionReasons).toContain("AI判定精度");
    expect(result.rejectionReasons).toContain("OCR精度");
    expect(result.rejectionReasons).toContain("処理時間短縮率");
    expect(result.rejectionReasons).toContain("品質均一化指標");
  });

  test("should provide detailed comparison metrics when AI precision is boundary case", () => {
    const modificationContent = {
      ocrPrecision: 95.1,
      aiJudgmentPrecision: 90.0,
      processingTimeReduction: 8.5,
      qualityUniformityIndex: 0.86,
      modificationDate: "2024-03-15T09:15:00Z",
      modifierId: "usr_mod_006",
      targetRegions: ["Tokyo", "Yokohama"],
      targetConstructionTypes: ["NewBuild"],
      targetAmountRanges: ["1M-5M", "5M-10M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    const result = validateModificationApprovalCriteria(
      modificationContent,
      approvalCriteria
    );

    expect(result.approvalStatus).toBe("APPROVED");
    expect(result.isApproved).toBe(true);
    expect(result.actualValue.aiJudgmentPrecision).toBe(90.0);
    expect(result.failureThreshold.aiJudgmentPrecision).toBe(90.0);
    expect(result.marginAiJudgmentPrecision).toBe(0.0);
  });

  test("should return structured rejection reason with improvement suggestion when AI precision falls short", () => {
    const modificationContent = {
      ocrPrecision: 96.5,
      aiJudgmentPrecision: 87.2,
      processingTimeReduction: 14.0,
      qualityUniformityIndex: 0.89,
      modificationDate: "2024-03-15T13:00:00Z",
      modifierId: "usr_mod_007",
      targetRegions: ["Fukuoka"],
      targetConstructionTypes: ["Renovation"],
      targetAmountRanges: ["1M-5M"],
    };

    const approvalCriteria = {
      minOcrPrecision: 95.0,
      minAiJudgmentPrecision: 90.0,
      minProcessingTimeReduction: 5.0,
      minQualityUniformityIndex: 0.85,
    };

    const result = validateModificationApprovalCriteria(
      modificationContent,
      approvalCriteria
    );

    expect(result.approvalStatus).toBe("REJECTED");
    expect(result.isApproved).toBe(false);
    expect(result.rejectionReasons).toContain("AI判定精度");
    expect(result.improvementRequired.aiJudgmentPrecision).toBe(
      90.0 - 87.2
    );
    expect(result.improvementRequired.aiJudgmentPrecision).toBeCloseTo(2.8, 1);
  });
});
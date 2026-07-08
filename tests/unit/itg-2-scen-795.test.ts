import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { AssessorJudgmentInput, AssessorJudgmentResult, LearningDataRecord } from "../../src/types/it-6-2-2-2";
import { recordAssessorJudgmentAndLearningData } from "../../src/logic/it-6-2-2-2";

const fetchMock = require("jest-fetch-mock");

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  test("SCEN-795: AI自動判定結果と査定員手動判定が一致する場合、査定員判定が記録される", async () => {
    // ===== Setup: テスト用の査定対象品と自動判定結果を準備 =====
    const quotationId = "QT20240115001";
    const assessorId = "ASS00001";
    const assessmentItemId = "ITEM0001";
    const itemName = "鉄骨工事";
    const quotedAmount = 2500000;
    const quotedQuantity = 50;
    const quotedUnitPrice = 50000;

    const aiAutoJudgmentResult = {
      quotationId: quotationId,
      assessmentItemId: assessmentItemId,
      itemName: itemName,
      quotedAmount: quotedAmount,
      quotedQuantity: quotedQuantity,
      quotedUnitPrice: quotedUnitPrice,
      marketDeviation: 2.5,
      deviationAmount: 62500,
      referenceDataCount: 12,
      referenceMarketPrice: 48780,
      correctionCoefficient: 1.02,
      confidenceScore: 92,
      judgmentLogicApplied: "REGION_SEASON_ADJUST",
      judgmentTimestamp: new Date("2024-01-15T10:30:00Z"),
    };

    const assessorManualJudgment = {
      quotationId: quotationId,
      assessorId: assessorId,
      assessmentItemId: assessmentItemId,
      itemName: itemName,
      quotedAmount: quotedAmount,
      quotedQuantity: quotedQuantity,
      quotedUnitPrice: quotedUnitPrice,
      marketDeviation: 2.5,
      deviationAmount: 62500,
      referenceDataCount: 12,
      referenceMarketPrice: 48780,
      correctionCoefficient: 1.02,
      judgmentDecision: "APPROVED",
      judgmentReason: "市場相場と一致。補正係数も適切。",
      judgmentTimestamp: new Date("2024-01-15T11:00:00Z"),
    };

    const expectedJudgmentResult: AssessorJudgmentResult = {
      quotationId: quotationId,
      assessorId: assessorId,
      assessmentItemId: assessmentItemId,
      recordedAmount: quotedAmount,
      recordedQuantity: quotedQuantity,
      recordedUnitPrice: quotedUnitPrice,
      recordedMarketDeviation: 2.5,
      recordedDeviationAmount: 62500,
      judgmentDecision: "APPROVED",
      matchStatus: "COMPLETE_MATCH",
      aiConfidenceScore: 92,
      assessorJudgmentTimestamp: new Date("2024-01-15T11:00:00Z"),
      recordedToDatabase: true,
      recordedDatabaseId: "DB20240115001",
    };

    const expectedLearningDataRecord: LearningDataRecord = {
      learningDataId: "LD20240115001",
      quotationId: quotationId,
      assessorId: assessorId,
      assessmentItemId: assessmentItemId,
      dataType: "ACCURATE_MATCH",
      itemCategory: "STEEL_WORK",
      amount: quotedAmount,
      quantity: quotedQuantity,
      unitPrice: quotedUnitPrice,
      marketDeviation: 2.5,
      deviationAmount: 62500,
      regionCode: "REGION_TOKYO",
      seasonCode: "SPRING_2024",
      referenceDataCount: 12,
      referenceMarketPrice: 48780,
      correctionCoefficient: 1.02,
      aiJudgmentResult: "APPROVED",
      assessorJudgmentResult: "APPROVED",
      matchingStatus: "COMPLETE_MATCH",
      recordedTimestamp: new Date("2024-01-15T11:05:00Z"),
      recordedToLearningDatabase: true,
      learningDataQualityScore: 98,
    };

    // ===== API Mock Setup =====
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        judgmentResult: expectedJudgmentResult,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        learningDataRecord: expectedLearningDataRecord,
      }),
      { status: 200 }
    );

    // ===== Call Function =====
    const input: AssessorJudgmentInput = {
      quotationId: quotationId,
      assessorId: assessorId,
      assessmentItemId: assessmentItemId,
      aiAutoJudgmentResult: aiAutoJudgmentResult,
      assessorManualJudgment: assessorManualJudgment,
      regionCode: "REGION_TOKYO",
      seasonCode: "SPRING_2024",
    };

    const result = await recordAssessorJudgmentAndLearningData(input);

    // ===== Assertions: 査定員判定の記録確認 =====
    expect(result.judgmentResult).toBeDefined();
    expect(result.judgmentResult.quotationId).toBe(quotationId);
    expect(result.judgmentResult.assessorId).toBe(assessorId);
    expect(result.judgmentResult.recordedAmount).toBe(2500000);
    expect(result.judgmentResult.recordedQuantity).toBe(50);
    expect(result.judgmentResult.recordedUnitPrice).toBe(50000);
    expect(result.judgmentResult.recordedMarketDeviation).toBe(2.5);
    expect(result.judgmentResult.recordedDeviationAmount).toBe(62500);
    expect(result.judgmentResult.judgmentDecision).toBe("APPROVED");
    expect(result.judgmentResult.matchStatus).toBe("COMPLETE_MATCH");
    expect(result.judgmentResult.aiConfidenceScore).toBe(92);
    expect(result.judgmentResult.recordedToDatabase).toBe(true);
    expect(result.judgmentResult.recordedDatabaseId).toBe("DB20240115001");

    // ===== Assertions: 学習データの記録確認 =====
    expect(result.learningDataRecord).toBeDefined();
    expect(result.learningDataRecord.quotationId).toBe(quotationId);
    expect(result.learningDataRecord.assessorId).toBe(assessorId);
    expect(result.learningDataRecord.dataType).toBe("ACCURATE_MATCH");
    expect(result.learningDataRecord.amount).toBe(2500000);
    expect(result.learningDataRecord.quantity).toBe(50);
    expect(result.learningDataRecord.unitPrice).toBe(50000);
    expect(result.learningDataRecord.marketDeviation).toBe(2.5);
    expect(result.learningDataRecord.deviationAmount).toBe(62500);
    expect(result.learningDataRecord.regionCode).toBe("REGION_TOKYO");
    expect(result.learningDataRecord.seasonCode).toBe("SPRING_2024");
    expect(result.learningDataRecord.referenceDataCount).toBe(12);
    expect(result.learningDataRecord.referenceMarketPrice).toBe(48780);
    expect(result.learningDataRecord.correctionCoefficient).toBe(1.02);
    expect(result.learningDataRecord.aiJudgmentResult).toBe("APPROVED");
    expect(result.learningDataRecord.assessorJudgmentResult).toBe("APPROVED");
    expect(result.learningDataRecord.matchingStatus).toBe("COMPLETE_MATCH");
    expect(result.learningDataRecord.recordedToLearningDatabase).toBe(true);
    expect(result.learningDataRecord.learningDataQualityScore).toBe(98);

    // ===== Assertions: 一致度と信頼度の検証 =====
    expect(result.matchStatusDetails).toBeDefined();
    expect(result.matchStatusDetails.isCompleteMatch).toBe(true);
    expect(result.matchStatusDetails.amountMatch).toBe(true);
    expect(result.matchStatusDetails.quantityMatch).toBe(true);
    expect(result.matchStatusDetails.unitPriceMatch).toBe(true);
    expect(result.matchStatusDetails.deviationMatch).toBe(true);
    expect(result.matchStatusDetails.deviationAmountMatch).toBe(true);

    // ===== Assertions: 学習データ品質スコア検証 =====
    expect(result.learningDataQualityMetrics).toBeDefined();
    expect(result.learningDataQualityMetrics.overallQualityScore).toBe(98);
    expect(result.learningDataQualityMetrics.dataCompleteness).toBe(100);
    expect(result.learningDataQualityMetrics.aiAssessorAlignmentRate).toBe(100);

    // ===== Assertions: レコード保存状態の確認 =====
    expect(result.recordingStatus).toBe("SUCCESS");
    expect(result.message).toContain("査定員判定");
    expect(result.message).toContain("記録");

    // ===== Assertions: Fetch Call Verification =====
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall[0]).toContain("/api/judgment/record");
    expect(firstCall[1].method).toBe("POST");

    const secondCall = fetchMock.mock.calls[1];
    expect(secondCall[0]).toContain("/api/learning-data/record");
    expect(secondCall[1].method).toBe("POST");
  });
});
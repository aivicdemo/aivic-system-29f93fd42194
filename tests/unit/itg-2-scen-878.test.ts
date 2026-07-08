import { describe, test, expect } from "@jest/globals";
import { generateExplanationDocument } from "../../src/logic/it-6-2-2-1";

describe("判定根拠統合・説明資料自動生成機能", () => {
  test("SCEN-878: 必須項目（相場乖離率またはAI判定結果）が欠落している場合、エラーを返す", () => {
    // テストデータ: 相場乖離率とAI判定結果の両方が欠落した判定根拠データ
    const incompleteJudgmentBasis = {
      estimateId: "EST-2024-001",
      ocrReadResult: {
        amount: 1500000,
        quantity: 100,
        unitPrice: 15000,
      },
      deviationRate: null, // 必須項目: 相場乖離率が欠落
      aiJudgmentResult: null, // 必須項目: AI判定結果が欠落
      referenceDataCount: 45,
      correctionCoefficient: 1.02,
      judgmentTimestamp: "2024-01-15T10:30:00Z",
      judgedByUserId: "USER-001",
    };

    // 相場乖離率が欠落している場合、エラーを返すことを確認
    expect(() =>
      generateExplanationDocument({
        ...incompleteJudgmentBasis,
        deviationRate: null,
      })
    ).toThrow(/相場乖離率/);

    // AI判定結果が欠落している場合、エラーを返すことを確認
    expect(() =>
      generateExplanationDocument({
        ...incompleteJudgmentBasis,
        aiJudgmentResult: null,
      })
    ).toThrow(/判定結果/);

    // 両方が欠落している場合、エラーを返すことを確認
    expect(() =>
      generateExplanationDocument(incompleteJudgmentBasis)
    ).toThrow(/必須項目/);

    // 正常系: 両方の必須項目が存在する場合、エラーは発生しない
    const completeJudgmentBasis = {
      estimateId: "EST-2024-001",
      ocrReadResult: {
        amount: 1500000,
        quantity: 100,
        unitPrice: 15000,
      },
      deviationRate: 8.5, // 相場乖離率: 8.5%
      aiJudgmentResult: {
        verdict: "APPROVED",
        confidenceScore: 92,
      },
      referenceDataCount: 45,
      correctionCoefficient: 1.02,
      judgmentTimestamp: "2024-01-15T10:30:00Z",
      judgedByUserId: "USER-001",
    };

    const result = generateExplanationDocument(completeJudgmentBasis);

    // 説明資料が正常に生成されることを確認
    expect(result).toEqual({
      documentId: expect.any(String),
      estimateId: "EST-2024-001",
      generatedAt: expect.any(String),
      deviationRatePercentage: 8.5,
      deviationAmountYen: 127500, // 1,500,000 * 8.5% = 127,500
      aiVerdictLabel: "APPROVED",
      confidenceScorePercentage: 92,
      referenceDataCount: 45,
      correctionCoefficientApplied: 1.02,
      graphUrl: expect.any(String),
      explanationText: expect.any(String),
      status: "GENERATED",
    });

    // 生成された説明資料が必要な情報をすべて含むことを確認
    expect(result.deviationRatePercentage).toBe(8.5);
    expect(result.deviationAmountYen).toBe(127500);
    expect(result.aiVerdictLabel).toBe("APPROVED");
    expect(result.confidenceScorePercentage).toBe(92);
    expect(result.status).toBe("GENERATED");
  });
});
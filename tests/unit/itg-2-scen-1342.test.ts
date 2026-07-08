import { recordOCRReadingAccuracyJudgment } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1342: [normal] OCR読取精度判定 - OCR読取結果が許容誤差率内で合格と自動判定される
  test("OCR読取結果の誤差率が許容範囲内の場合、システムが自動的に合格と判定し、判定ステータスと詳細情報を記録する", () => {
    const input = {
      ocrImageId: "img_20240115_001",
      readingResults: {
        constructionType: "鉄骨造",
        estimatedAmount: 5250000,
        quantity: 150,
        unitPrice: 35000,
      },
      referenceData: {
        constructionType: "鉄骨造",
        estimatedAmount: 5300000,
        quantity: 152,
        unitPrice: 34868,
      },
      toleranceErrorRate: 0.05,
      judgmentDateTime: new Date("2024-01-15T11:30:00Z"),
      recordedBy: "user_assessment_001",
    };

    const expectedErrorRateAmount =
      Math.abs(input.readingResults.estimatedAmount - input.referenceData.estimatedAmount) /
      input.referenceData.estimatedAmount;
    const expectedErrorRateQuantity =
      Math.abs(input.readingResults.quantity - input.referenceData.quantity) /
      input.referenceData.quantity;
    const expectedErrorRateUnitPrice =
      Math.abs(input.readingResults.unitPrice - input.referenceData.unitPrice) /
      input.referenceData.unitPrice;

    const result = recordOCRReadingAccuracyJudgment(input);

    expect(result).toEqual({
      judgmentId: expect.any(String),
      ocrImageId: "img_20240115_001",
      judgmentStatus: "合格",
      errorRateAmount: expectedErrorRateAmount,
      errorRateQuantity: expectedErrorRateQuantity,
      errorRateUnitPrice: expectedErrorRateUnitPrice,
      maxErrorRate: Math.max(expectedErrorRateAmount, expectedErrorRateQuantity, expectedErrorRateUnitPrice),
      toleranceErrorRate: 0.05,
      isWithinTolerance: true,
      constructionTypeMatch: true,
      judgmentDateTime: new Date("2024-01-15T11:30:00Z"),
      recordedBy: "user_assessment_001",
      recordedAt: expect.any(Date),
      detailInformation: {
        amountDifference: Math.abs(input.readingResults.estimatedAmount - input.referenceData.estimatedAmount),
        quantityDifference: Math.abs(input.readingResults.quantity - input.referenceData.quantity),
        unitPriceDifference: Math.abs(input.readingResults.unitPrice - input.referenceData.unitPrice),
      },
    });

    expect(result.judgmentStatus).toBe("合格");
    expect(result.isWithinTolerance).toBe(true);
    expect(result.maxErrorRate).toBeLessThanOrEqual(input.toleranceErrorRate);
    expect(result.constructionTypeMatch).toBe(true);
    expect(result.recordedAt).toBeInstanceOf(Date);
  });
});
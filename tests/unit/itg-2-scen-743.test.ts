import { calculateQualityCheckResult } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-743: [error] 品質チェック自動判定機能 - 判定根拠の信頼度が基準未満のとき不合格判定となり修正指示が表示される
  test("判定根拠の信頼度が基準未満（60%）のとき、不合格判定と修正指示メッセージが返される", () => {
    const input = {
      assessorId: "assessor_001",
      constructionType: "鉄骨造",
      amountBand: "1000万円以上2000万円未満",
      estimatedAmount: 1500,
      quotationItems: [
        {
          itemId: "item_001",
          description: "鋼材一式",
          quantity: 100,
          unitPrice: 150000,
          totalAmount: 15000000,
          marketPrice: 16000000,
          deviationRate: 0.0625,
        },
      ],
      referenceDataCount: 25,
      confidenceScore: 60,
      confidenceThreshold: 70,
      deviationAmountLimit: 2000000,
      applicationLogicId: "logic_std_001",
      correctionCoefficient: 1.0,
      referenceMarketRegion: "東京",
      referenceMarketSeason: "2024Q1",
    };

    const result = calculateQualityCheckResult(input);

    expect(result.judgmentStatus).toBe("不合格");
    expect(result.confidenceScore).toBe(60);
    expect(result.confidenceThreshold).toBe(70);
    expect(result.confidenceDeficiency).toBe(10);
    expect(result.correctionMessage).toContain("信頼度が基準を下回っています");
    expect(result.correctionMessage).toContain("査定内容を修正してください");
    expect(result.errorCode).toBe("ERR_CONFIDENCE_BELOW_THRESHOLD");
    expect(result.errorDetails).toContain("信頼度不足");
    expect(result.requiresManualReview).toBe(true);
    expect(result.allowsAutoApproval).toBe(false);
  });
});
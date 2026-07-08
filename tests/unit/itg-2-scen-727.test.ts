import { calculateConfidenceScore } from "../../src/logic/it-6-2-1-1";

describe("AI判定結果信頼度スコア付与", () => {
  // SCEN-727: [edge] AI判定結果信頼度スコア付与 - 信頼度スコアが50を境界値として正確に計算・表示される
  test("信頼度スコアが50を境界値として正確に計算・表示される", () => {
    // エッジケース1: スコア49（低信頼度）
    const input_49 = {
      judgementReasonCount: 3,
      modelConsistencyRate: 0.65,
      learningDataFitnessScore: 0.82,
      referenceDataSize: 15,
      formulaVersion: "v1.0",
    };
    const result_49 = calculateConfidenceScore(input_49);
    expect(result_49.confidenceScore).toBe(49);
    expect(result_49.confidenceLevel).toBe("low");
    expect(result_49.displayConfidenceScore).toBe(49);

    // 境界値ケース: スコア50（高信頼度の開始点）
    const input_50 = {
      judgeementReasonCount: 4,
      modelConsistencyRate: 0.72,
      learningDataFitnessScore: 0.85,
      referenceDataSize: 20,
      formulaVersion: "v1.0",
    };
    const result_50 = calculateConfidenceScore(input_50);
    expect(result_50.confidenceScore).toBe(50);
    expect(result_50.confidenceLevel).toBe("high");
    expect(result_50.displayConfidenceScore).toBe(50);

    // エッジケース2: スコア51（高信頼度）
    const input_51 = {
      judgeementReasonCount: 5,
      modelConsistencyRate: 0.78,
      learningDataFitnessScore: 0.88,
      referenceDataSize: 25,
      formulaVersion: "v1.0",
    };
    const result_51 = calculateConfidenceScore(input_51);
    expect(result_51.confidenceScore).toBe(51);
    expect(result_51.confidenceLevel).toBe("high");
    expect(result_51.displayConfidenceScore).toBe(51);

    // 境界値処理の正確性を確認
    expect(result_49.confidenceLevel).not.toBe(result_50.confidenceLevel);
    expect(result_50.confidenceLevel).toBe(result_51.confidenceLevel);

    // UI画面表示の正確性を確認
    expect(typeof result_49.displayConfidenceScore).toBe("number");
    expect(typeof result_50.displayConfidenceScore).toBe("number");
    expect(typeof result_51.displayConfidenceScore).toBe("number");

    expect(result_49.displayConfidenceScore).toBeGreaterThanOrEqual(0);
    expect(result_49.displayConfidenceScore).toBeLessThanOrEqual(100);
    expect(result_50.displayConfidenceScore).toBeGreaterThanOrEqual(0);
    expect(result_50.displayConfidenceScore).toBeLessThanOrEqual(100);
    expect(result_51.displayConfidenceScore).toBeGreaterThanOrEqual(0);
    expect(result_51.displayConfidenceScore).toBeLessThanOrEqual(100);

    // 信頼度スコア計算の一貫性を確認
    expect(result_49.confidenceScore).toBeLessThan(50);
    expect(result_50.confidenceScore).toBeGreaterThanOrEqual(50);
    expect(result_51.confidenceScore).toBeGreaterThan(50);
  });
});
import { validateLearningDatasetQuality } from "../../src/logic/it-6-2-1-1";

describe("Learning Dataset Quality Validation by Amount Digit Patterns", () => {
  test("SCEN-1359:金額体系の桁数が異なる場合に品質基準への適合判定が正確に行われる", () => {
    // テストデータセット: 複数の金額体系パターン（1桁～10桁）
    const singleDigitAmounts = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const fiveDigitAmounts = [10000, 15000, 20000, 25000, 30000];
    const tenDigitAmounts = [1000000000, 2000000000, 3000000000];

    // 1桁金額データセットの検証
    const singleDigitResult = validateLearningDatasetQuality({
      amounts: singleDigitAmounts,
      totalRecords: 9,
      coverageRate: 0.85,
      dataQualityScore: 0.92,
    });

    expect(singleDigitResult).toEqual({
      isQualityMet: true,
      digitPattern: "single",
      conformanceScore: 0.88,
      details: {
        amountDigits: 1,
        recordCount: 9,
        coveragePercentage: 85,
        qualityScore: 92,
      },
    });

    // 5桁金額データセットの検証
    const fiveDigitResult = validateLearningDatasetQuality({
      amounts: fiveDigitAmounts,
      totalRecords: 50,
      coverageRate: 0.92,
      dataQualityScore: 0.95,
    });

    expect(fiveDigitResult).toEqual({
      isQualityMet: true,
      digitPattern: "fiveDigit",
      conformanceScore: 0.93,
      details: {
        amountDigits: 5,
        recordCount: 50,
        coveragePercentage: 92,
        qualityScore: 95,
      },
    });

    // 10桁金額データセットの検証
    const tenDigitResult = validateLearningDatasetQuality({
      amounts: tenDigitAmounts,
      totalRecords: 120,
      coverageRate: 0.88,
      dataQualityScore: 0.89,
    });

    expect(tenDigitResult).toEqual({
      isQualityMet: true,
      digitPattern: "tenDigit",
      conformanceScore: 0.89,
      details: {
        amountDigits: 10,
        recordCount: 120,
        coveragePercentage: 88,
        qualityScore: 89,
      },
    });

    // 複合データセット全体の品質スコア集計
    const combinedDataset = [
      ...singleDigitAmounts,
      ...fiveDigitAmounts,
      ...tenDigitAmounts,
    ];

    const combinedResult = validateLearningDatasetQuality({
      amounts: combinedDataset,
      totalRecords: 179,
      coverageRate: 0.90,
      dataQualityScore: 0.92,
    });

    expect(combinedResult).toEqual({
      isQualityMet: true,
      digitPattern: "mixed",
      conformanceScore: 0.91,
      details: {
        amountDigits: "mixed (1, 5, 10)",
        recordCount: 179,
        coveragePercentage: 90,
        qualityScore: 92,
      },
    });

    // 各桁数パターンの個別検証結果が品質基準を満たしているか確認
    expect(singleDigitResult.isQualityMet).toBe(true);
    expect(fiveDigitResult.isQualityMet).toBe(true);
    expect(tenDigitResult.isQualityMet).toBe(true);

    // 複合データセット全体の品質基準値との比較
    expect(combinedResult.conformanceScore).toBeGreaterThanOrEqual(0.90);
    expect(combinedResult.conformanceScore).toBeLessThanOrEqual(1.0);

    // 個別スコアと集計スコアの一貫性を確認
    const averageConformanceScore =
      (singleDigitResult.conformanceScore +
        fiveDigitResult.conformanceScore +
        tenDigitResult.conformanceScore) /
      3;

    expect(combinedResult.conformanceScore).toBeCloseTo(averageConformanceScore, 2);
  });
});
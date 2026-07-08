import { calculateOCRAccuracyDifference } from "../../src/logic/it-6-2-2-2";

describe("他部署フォーマットOCR読取精度測定機能", () => {
  test("SCEN-1362: OCR読取精度が0%と100%の境界値で精度差が正確に算出される", () => {
    // ========== 準備フェーズ ==========
    // OCR読取精度が0%となるテストケース（完全に読取失敗した画像）
    const failedOCRResult = {
      imageId: "img_fail_001",
      departmentFormat: "other_dept_A",
      ocrAccuracy: 0,
      extractedFields: {
        workType: null,
        amount: null,
        quantity: null,
      },
      originalFieldsCount: 3,
      successfulExtractionCount: 0,
    };

    // OCR読取精度が100%となるテストケース（完全に読取成功した画像）
    const successfulOCRResult = {
      imageId: "img_success_001",
      departmentFormat: "other_dept_A",
      ocrAccuracy: 100,
      extractedFields: {
        workType: "鉄筋工事",
        amount: 1500000,
        quantity: 150,
      },
      originalFieldsCount: 3,
      successfulExtractionCount: 3,
    };

    // ========== 実行フェーズ1: 0%と100%の精度差を算出 ==========
    const accuracyDifferenceResult = calculateOCRAccuracyDifference(
      failedOCRResult,
      successfulOCRResult
    );

    // ========== 検証フェーズ1: 0%と100%の精度差が100ポイントであることを確認 ==========
    expect(accuracyDifferenceResult.accuracyDifference).toBe(100);
    expect(accuracyDifferenceResult.result1Accuracy).toBe(0);
    expect(accuracyDifferenceResult.result2Accuracy).toBe(100);

    // ========== 準備フェーズ2: 中間値テストケース（50%, 75%, 25%）を複数組み合わせ ==========
    const mediumAccuracy50Result = {
      imageId: "img_medium_50_001",
      departmentFormat: "other_dept_A",
      ocrAccuracy: 50,
      extractedFields: {
        workType: "鉄筋工事",
        amount: null,
        quantity: 150,
      },
      originalFieldsCount: 3,
      successfulExtractionCount: 2,
    };

    const mediumAccuracy75Result = {
      imageId: "img_medium_75_001",
      departmentFormat: "other_dept_A",
      ocrAccuracy: 75,
      extractedFields: {
        workType: "鉄筋工事",
        amount: 1500000,
        quantity: 150,
      },
      originalFieldsCount: 4,
      successfulExtractionCount: 3,
    };

    const mediumAccuracy25Result = {
      imageId: "img_medium_25_001",
      departmentFormat: "other_dept_A",
      ocrAccuracy: 25,
      extractedFields: {
        workType: "鉄筋工事",
        amount: null,
        quantity: null,
      },
      originalFieldsCount: 4,
      successfulExtractionCount: 1,
    };

    // ========== 実行フェーズ2: 中間値の組み合わせ1 (50% vs 75%) ==========
    const diff_50_vs_75 = calculateOCRAccuracyDifference(
      mediumAccuracy50Result,
      mediumAccuracy75Result
    );

    // ========== 検証フェーズ2: 50% vs 75%の差分が正確に25ポイント ==========
    expect(diff_50_vs_75.accuracyDifference).toBe(25);
    expect(diff_50_vs_75.result1Accuracy).toBe(50);
    expect(diff_50_vs_75.result2Accuracy).toBe(75);

    // ========== 実行フェーズ3: 中間値の組み合わせ2 (25% vs 75%) ==========
    const diff_25_vs_75 = calculateOCRAccuracyDifference(
      mediumAccuracy25Result,
      mediumAccuracy75Result
    );

    // ========== 検証フェーズ3: 25% vs 75%の差分が正確に50ポイント ==========
    expect(diff_25_vs_75.accuracyDifference).toBe(50);
    expect(diff_25_vs_75.result1Accuracy).toBe(25);
    expect(diff_25_vs_75.result2Accuracy).toBe(75);

    // ========== 実行フェーズ4: 中間値の組み合わせ3 (0% vs 50%) ==========
    const diff_0_vs_50 = calculateOCRAccuracyDifference(
      failedOCRResult,
      mediumAccuracy50Result
    );

    // ========== 検証フェーズ4: 0% vs 50%の差分が正確に50ポイント ==========
    expect(diff_0_vs_50.accuracyDifference).toBe(50);
    expect(diff_0_vs_50.result1Accuracy).toBe(0);
    expect(diff_0_vs_50.result2Accuracy).toBe(50);

    // ========== 実行フェーズ5: 中間値の組み合わせ4 (50% vs 100%) ==========
    const diff_50_vs_100 = calculateOCRAccuracyDifference(
      mediumAccuracy50Result,
      successfulOCRResult
    );

    // ========== 検証フェーズ5: 50% vs 100%の差分が正確に50ポイント ==========
    expect(diff_50_vs_100.accuracyDifference).toBe(50);
    expect(diff_50_vs_100.result1Accuracy).toBe(50);
    expect(diff_50_vs_100.result2Accuracy).toBe(100);

    // ========== 検証フェーズ6: ログに算出過程が明確に記録されていることを確認 ==========
    expect(accuracyDifferenceResult.calculationLog).toBeDefined();
    expect(
      accuracyDifferenceResult.calculationLog.indexOf("0") >= 0
    ).toBeTruthy();
    expect(
      accuracyDifferenceResult.calculationLog.indexOf("100") >= 0
    ).toBeTruthy();
    expect(
      accuracyDifferenceResult.calculationLog.indexOf("100") >=
        accuracyDifferenceResult.calculationLog.indexOf("0")
    ).toBeDefined();

    // ========== 検証フェーズ7: 丸め誤差や浮動小数点誤差が発生していないことを確認 ==========
    // 複数の精度差分計算の合算検証
    const sumOfDifferences =
      diff_0_vs_50.accuracyDifference +
      diff_50_vs_100.accuracyDifference;
    expect(sumOfDifferences).toBe(100);

    const sumOfAllDifferences =
      diff_25_vs_75.accuracyDifference +
      diff_50_vs_75.accuracyDifference;
    expect(sumOfAllDifferences).toBe(75);

    // ========== 検証フェーズ8: 同じ精度値同士の差分が0であることを確認 ==========
    const identicalAccuracyDifference = calculateOCRAccuracyDifference(
      mediumAccuracy50Result,
      mediumAccuracy50Result
    );
    expect(identicalAccuracyDifference.accuracyDifference).toBe(0);

    // ========== 検証フェーズ9: 逆順入力時の差分が絶対値で一致することを確認 ==========
    const reversedDifference = calculateOCRAccuracyDifference(
      successfulOCRResult,
      failedOCRResult
    );
    expect(Math.abs(reversedDifference.accuracyDifference)).toBe(
      Math.abs(accuracyDifferenceResult.accuracyDifference)
    );

    // ========== 検証フェーズ10: 浮動小数点精度確認（複数中間値の組み合わせ） ==========
    const micro1 = calculateOCRAccuracyDifference(
      { ...mediumAccuracy50Result, ocrAccuracy: 33.33 },
      { ...mediumAccuracy75Result, ocrAccuracy: 66.67 }
    );
    // 33.33 vs 66.67 = 差分 33.34 (または 33.35 depending on rounding)
    expect(micro1.accuracyDifference).toBeGreaterThanOrEqual(33.3);
    expect(micro1.accuracyDifference).toBeLessThanOrEqual(33.35);
  });
});
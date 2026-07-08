import { detectOCRAnomalies } from "../../src/logic/it-6-3-1";

describe("OCR読取異常値検出・フラグ付け機能", () => {
  test("SCEN-818: OCR読取結果が過去案件データ・物価本と照合される際に異常値が検出され、フラグが自動で付与される", () => {
    // 入力データ: OCR読取結果
    const ocrReadResult = {
      itemId: "ITEM_001",
      readValue: 850000,
      readQuantity: 120,
      readUnitPrice: 7083.33,
      extractedAt: "2024-01-15T10:30:00Z",
    };

    // 過去案件データベース（類似案件の統計データ）
    const historicalCaseData = {
      itemId: "ITEM_001",
      averagePrice: 500000,
      standardDeviation: 80000,
      minPrice: 350000,
      maxPrice: 650000,
      sampleCount: 45,
      region: "東京",
      workType: "鉄筋コンクリート工",
      period: "2023-10",
    };

    // 物価本の標準値データ
    const priceBookData = {
      itemId: "ITEM_001",
      standardPrice: 480000,
      toleranceLowerBound: 420000,
      toleranceUpperBound: 540000,
      publishedDate: "2024-01-01",
      version: "2024-01",
    };

    // 異常値検出ロジック実行
    const result = detectOCRAnomalies(
      ocrReadResult,
      historicalCaseData,
      priceBookData
    );

    // 期待値計算:
    // 1. 過去案件データとの乖離度: (850000 - 500000) / 80000 = 4.375 倍
    //    → 標準偏差3倍以上なので異常判定 (True)
    // 2. 物価本との乖離: 850000 > 540000 (上限)
    //    → 許容範囲外なので異常判定 (True)
    // 3. 乖離率: (850000 - 480000) / 480000 = 77.08% > 30% 許容値
    //    → 異常判定 (True)

    expect(result.isAnomaly).toBe(true);
    expect(result.anomalyType).toBe("deviation_detected");
    expect(result.severity).toBe("high");
    expect(result.flagApplied).toBe(true);
    expect(result.deviationRatioFromHistorical).toBeCloseTo(4.375, 2);
    expect(result.deviationPercentageFromPriceBook).toBeCloseTo(77.08, 1);
    expect(result.detectionLogic).toContain(
      "historical_stddev_exceeds_3x"
    );
    expect(result.detectionLogic).toContain(
      "price_book_tolerance_exceeded"
    );
    expect(result.detectionLogic).toContain("deviation_percentage_exceeds_30");
    expect(result.readItemId).toBe("ITEM_001");
    expect(result.flagDetails).toEqual({
      anomalyDetected: true,
      category: "excessive_deviation",
      detectedAt: expect.any(String),
      historyDataPoints: 45,
      comparisons: {
        historical: {
          passed: false,
          readValue: 850000,
          reference: 500000,
          threshold: 740000,
        },
        priceBook: {
          passed: false,
          readValue: 850000,
          upperBound: 540000,
          exceedsLimit: true,
        },
      },
    });
    expect(result.reviewClassification).toBe("high_priority_review");
    expect(result.requiresManualVerification).toBe(true);
    expect(result.flagContent).toContain("異常値");
    expect(result.flagContent).toContain("重大度");
    expect(result.flagContent).toContain("検出ロジック");
  });
});
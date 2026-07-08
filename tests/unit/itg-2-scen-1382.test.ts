import { analyzePrecisionDeclineReasons } from "../../src/logic/it-6-2-1-1";

describe("精度低下原因の分析・カスタマイズ範囲特定", () => {
  test("SCEN-1382: 複数の原因（フォーマット差異と学習データ不足）が混在する場合、優先度順に分類される", () => {
    // Arrange: テストデータ（複数原因が混在するケース）
    const inputData = {
      ocrPrecisionBefore: 92.5,
      ocrPrecisionAfter: 85.3,
      judgmentPrecisionBefore: 88.7,
      judgmentPrecisionAfter: 79.4,
      targetDepartmentFormat: "OTHER_FORMAT_A",
      assessmentDepartmentFormat: "STANDARD_FORMAT",
      learningDataSampleCount: 45,
      minimumRequiredSampleCount: 150,
      detectedFormatDifferences: [
        { fieldName: "金額体系", incompatibilityScore: 85 },
        { fieldName: "項目分類", incompatibilityScore: 72 }
      ],
      dataGapRegions: ["東京", "大阪"],
      dataGapConstructionTypes: ["建築", "土木"],
      lastDataUpdateDays: 120
    };

    // Act: 分析実行
    const analysisResult = analyzePrecisionDeclineReasons(inputData);

    // Assert: 複数原因が優先度順に分類されていることを検証

    // 1. 分析結果の構造を検証
    expect(analysisResult).toHaveProperty("rootCauses");
    expect(Array.isArray(analysisResult.rootCauses)).toBe(true);
    expect(analysisResult.rootCauses.length).toBeGreaterThan(0);

    // 2. 原因が優先度順にソートされていることを検証
    const causes = analysisResult.rootCauses;
    for (let i = 0; i < causes.length - 1; i++) {
      expect(causes[i].priorityScore).toBeGreaterThanOrEqual(
        causes[i + 1].priorityScore
      );
    }

    // 3. フォーマット差異が最優先（優先度スコア最高）であることを検証
    const formatDifferenceCause = causes.find(
      (c) => c.rootCauseType === "FORMAT_DIFFERENCE"
    );
    expect(formatDifferenceCause).toBeDefined();
    expect(formatDifferenceCause.priorityScore).toBe(92);
    expect(formatDifferenceCause.priorityRank).toBe("HIGH");

    // 4. 学習データ不足が次優先（優先度スコア中程度）であることを検証
    const dataShortfallCause = causes.find(
      (c) => c.rootCauseType === "LEARNING_DATA_INSUFFICIENT"
    );
    expect(dataShortfallCause).toBeDefined();
    expect(dataShortfallCause.priorityScore).toBe(68);
    expect(dataShortfallCause.priorityRank).toBe("MEDIUM");

    // 5. 各原因の詳細情報を検証
    expect(formatDifferenceCause.detailDescription).toContain("金額体系");
    expect(formatDifferenceCause.detailDescription).toContain("項目分類");
    expect(formatDifferenceCause.recommendedAction).toContain(
      "OCRモデル調整"
    );

    expect(dataShortfallCause.detailDescription).toContain("東京");
    expect(dataShortfallCause.detailDescription).toContain("建築");
    expect(dataShortfallCause.recommendedAction).toContain("学習データ追加");

    // 6. 精度低下の計算値を検証
    // OCR精度低下率 = (92.5 - 85.3) / 92.5 * 100 = 7.83%
    expect(analysisResult.ocrPrecisionDeclineRate).toBe(7.83);
    // 相場判定精度低下率 = (88.7 - 79.4) / 88.7 * 100 = 10.55%
    expect(analysisResult.judgmentPrecisionDeclineRate).toBe(10.55);

    // 7. 学習データギャップの定量化を検証
    // サンプル数不足率 = (45 - 150) / 150 * 100 = -70%（逆向きで表現）
    expect(analysisResult.dataGapPercentage).toBe(70);

    // 8. 推奨カスタマイズ範囲を検証
    expect(analysisResult.customizationScope).toHaveProperty("ocrModelAdjustment");
    expect(analysisResult.customizationScope).toHaveProperty(
      "learningDataExpansion"
    );
    expect(analysisResult.customizationScope.ocrModelAdjustment.required).toBe(
      true
    );
    expect(analysisResult.customizationScope.learningDataExpansion.required).toBe(
      true
    );

    // 9. 追加学習に必要なデータ件数を検証
    // 必要最小サンプル数 150 に対し現在 45 件なので、追加必要: 150 - 45 = 105 件
    expect(
      analysisResult.customizationScope.learningDataExpansion.additionalSamplesNeeded
    ).toBe(105);

    // 10. 実装難度スコアを検証（フォーマット差異は実装難度高い）
    expect(formatDifferenceCause.implementationDifficultyScore).toBe(78);
    // 学習データ不足は実装難度中程度
    expect(dataShortfallCause.implementationDifficultyScore).toBe(45);

    // 11. 全体的な対応優先度を検証
    expect(analysisResult.overallPriorityRank).toBe("HIGH");
    expect(analysisResult.estimatedCompletionDays).toBe(12);

    // 12. 詳細情報の完全性を検証
    causes.forEach((cause) => {
      expect(cause).toHaveProperty("rootCauseType");
      expect(cause).toHaveProperty("priorityScore");
      expect(cause).toHaveProperty("priorityRank");
      expect(cause).toHaveProperty("detailDescription");
      expect(cause).toHaveProperty("recommendedAction");
      expect(cause).toHaveProperty("implementationDifficultyScore");
      expect(typeof cause.priorityScore).toBe("number");
      expect(cause.priorityScore).toBeGreaterThanOrEqual(0);
      expect(cause.priorityScore).toBeLessThanOrEqual(100);
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(cause.priorityRank);
    });
  });
});
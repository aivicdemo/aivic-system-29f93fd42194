import { measureLearningDataQualityAndCorrelation } from "../../src/logic/it-6-2-2-1";

describe("学習データ品質監視と相関分析", () => {
  test("SCEN-1186: 学習データ更新後の品質指標測定と相関分析が実施される", () => {
    // 準備: 学習データ更新前のベースライン精度
    const baselineOcrAccuracy = 0.88;
    const baselineAiAccuracy = 0.85;

    // 学習データセット（新規追加分）
    const newLearningData = {
      pastProjectDataCount: 250,
      priceBookUpdateVersion: 3,
      regionCoveragePercentage: 0.92,
      seasonalCoveragePercentage: 0.88,
      dataQualityScore: 0.91,
    };

    // 学習データ更新後に測定されたOCR精度
    // 期待: 新規データによりOCR精度が 0.88 から 0.912 に向上（相関係数: 0.85で高相関）
    const updatedOcrAccuracy = 0.912;

    // 学習データ更新後に測定されたAI判定精度
    // 期待: 新規データによりAI判定精度が 0.85 から 0.891 に向上（相関係数: 0.85で高相関）
    const updatedAiAccuracy = 0.891;

    // 相関分析結果
    const correlationResult = measureLearningDataQualityAndCorrelation({
      baselineOcrAccuracy,
      baselineAiAccuracy,
      newLearningData,
      updatedOcrAccuracy,
      updatedAiAccuracy,
    });

    // Assertion 1: 品質指標が正確に測定されている
    expect(correlationResult.ocrAccuracyMeasured).toBe(0.912);
    expect(correlationResult.aiAccuracyMeasured).toBe(0.891);

    // Assertion 2: OCR精度の改善率が正しく計算されている
    // 改善率 = (0.912 - 0.88) / 0.88 = 0.0363... ≈ 3.64%
    expect(correlationResult.ocrAccuracyImprovementRate).toBeCloseTo(0.0364, 4);

    // Assertion 3: AI判定精度の改善率が正しく計算されている
    // 改善率 = (0.891 - 0.85) / 0.85 = 0.0482... ≈ 4.82%
    expect(correlationResult.aiAccuracyImprovementRate).toBeCloseTo(0.0482, 4);

    // Assertion 4: 相関係数が高相関を示している
    // 学習データ品質スコア(0.91)とOCR精度(0.912)、AI精度(0.891)の相関係数は高い
    expect(correlationResult.correlationCoefficient).toBeCloseTo(0.85, 2);

    // Assertion 5: 学習データ品質スコアが信頼度範囲内
    expect(correlationResult.dataQualityScore).toBe(0.91);
    expect(correlationResult.dataQualityScore).toBeGreaterThanOrEqual(0.85);
    expect(correlationResult.dataQualityScore).toBeLessThanOrEqual(1.0);

    // Assertion 6: 過去案件データカウントが記録されている
    expect(correlationResult.pastProjectDataCount).toBe(250);

    // Assertion 7: 地域カバレッジ率が基準値以上
    expect(correlationResult.regionCoveragePercentage).toBe(0.92);
    expect(correlationResult.regionCoveragePercentage).toBeGreaterThanOrEqual(0.9);

    // Assertion 8: 季節カバレッジ率が基準値以上
    expect(correlationResult.seasonalCoveragePercentage).toBe(0.88);
    expect(correlationResult.seasonalCoveragePercentage).toBeGreaterThanOrEqual(0.85);

    // Assertion 9: 相関分析レポートが生成される
    expect(correlationResult.correlationReportGenerated).toBe(true);

    // Assertion 10: レポート内の統計値が存在する
    expect(correlationResult.reportStatistics).toBeDefined();
    expect(correlationResult.reportStatistics.meanAccuracy).toBeCloseTo(
      (0.912 + 0.891) / 2,
      4
    );
    expect(correlationResult.reportStatistics.standardDeviation).toBeCloseTo(
      0.0148,
      4
    );

    // Assertion 11: 可視化グラフ用データが正しく構成されている
    expect(correlationResult.visualizationData).toBeDefined();
    expect(correlationResult.visualizationData.xAxisLabel).toBe(
      "DataQualityScore"
    );
    expect(correlationResult.visualizationData.yAxisLabel).toBe(
      "PredictionAccuracy"
    );
    expect(Array.isArray(correlationResult.visualizationData.dataPoints)).toBe(
      true
    );
    expect(correlationResult.visualizationData.dataPoints.length).toBe(2);

    // Assertion 12: ダッシュボード反映状態が正常
    expect(correlationResult.dashboardReflected).toBe(true);
    expect(correlationResult.dashboardUpdateTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Assertion 13: 測定結果の信頼区間が適切
    expect(correlationResult.confidenceInterval).toBeDefined();
    expect(correlationResult.confidenceInterval.lower).toBeCloseTo(0.885, 3);
    expect(correlationResult.confidenceInterval.upper).toBeCloseTo(0.905, 3);

    // Assertion 14: OCR精度がベースラインから向上している
    expect(updatedOcrAccuracy).toBeGreaterThan(baselineOcrAccuracy);

    // Assertion 15: AI判定精度がベースラインから向上している
    expect(updatedAiAccuracy).toBeGreaterThan(baselineAiAccuracy);

    // Assertion 16: 相関係数が有意な範囲内
    expect(correlationResult.correlationCoefficient).toBeGreaterThan(0.7);
    expect(correlationResult.correlationCoefficient).toBeLessThanOrEqual(1.0);

    // Assertion 17: 品質監視の判定結果が「合格」
    expect(correlationResult.qualityJudgment).toBe("PASS");

    // Assertion 18: 改善提案フラグが適切に設定される
    // 相関係数が0.85以上なので改善提案は不要
    expect(correlationResult.improvementSuggestionRequired).toBe(false);

    // Assertion 19: 測定データの完全性チェック
    expect(correlationResult.measurementCompletion).toBe(1.0);

    // Assertion 20: 相関分析の実行ステータスが「完了」
    expect(correlationResult.correlationAnalysisStatus).toBe("COMPLETED");
  });
});
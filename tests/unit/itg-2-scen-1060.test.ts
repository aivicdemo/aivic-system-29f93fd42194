import {
  compareAssessorAccuracy,
} from "../../src/logic/it-6-2-2-2";

describe("査定員別判定精度比較・可視化機能", () => {
  test("SCEN-1060: 新人と経験者の能力差が定量的に比較可能な形式で可視化される", () => {
    // ビジネスルール: 月次査定業務が完了し、全査定員の査定結果データがシステムに記録されている状態。
    // 査定部署長が月次分析レポートを確認し、担当者別の判定精度を比較分析する必要が生じたとき、
    // 各査定員の判定精度（相場乖離の正確性、査定時間、修正率）を自動計算し、ダッシュボードで可視化。
    // また、新人と経験者の判定精度差、相場乖離の傾向差、査定処理時間の差を定量指標で可視化し、能力差の大きさと改善優先度を数値で把握。

    const noviceAssessorId = "ASS-001";
    const experiencedAssessorId = "ASS-002";
    const comparisonPeriodMonths = 3;

    // 新人査定員の3ヶ月実績データ
    // 正確性率（相場乖離率の許容範囲内判定率）: 78%
    // 判定一致率（複数査定による一致度）: 82%
    // 平均評価スコア（0-100）: 76点
    // 平均査定時間（分）: 28分
    // 修正率（査定部署長による修正指示率）: 15%
    const noviceData = {
      assessorId: noviceAssessorId,
      assessmentCount: 120,
      accuracyRate: 78.0,
      agreementRate: 82.0,
      averageScore: 76,
      averageAssessmentTimeMinutes: 28,
      correctionRate: 15.0,
      deviationPatterns: {
        underestimated: 35,
        overestimated: 28,
        standard: 57,
      },
    };

    // 経験者査定員の3ヶ月実績データ
    // 正確性率: 94%
    // 判定一致率: 96%
    // 平均評価スコア: 92点
    // 平均査定時間: 18分
    // 修正率: 4%
    const experiencedData = {
      assessorId: experiencedAssessorId,
      assessmentCount: 118,
      accuracyRate: 94.0,
      agreementRate: 96.0,
      averageScore: 92,
      averageAssessmentTimeMinutes: 18,
      correctionRate: 4.0,
      deviationPatterns: {
        underestimated: 8,
        overestimated: 6,
        standard: 104,
      },
    };

    // 比較実行パラメータ
    const comparisonParams = {
      noviceAssessorId: noviceAssessorId,
      experiencedAssessorId: experiencedAssessorId,
      periodMonths: comparisonPeriodMonths,
      noviceMetrics: noviceData,
      experiencedMetrics: experiencedData,
    };

    // 期待される比較結果
    // 能力差を定量的に計算
    const expectedAccuracyGap = 94.0 - 78.0; // 16.0%
    const expectedAgreementGap = 96.0 - 82.0; // 14.0%
    const expectedScoreGap = 92 - 76; // 16点
    const expectedTimeGap = 28 - 18; // 10分短縮（経験者の優位性）
    const expectedCorrectionRateGap = 15.0 - 4.0; // 11.0%（新人の修正率が高い）

    // 相場乖離パターンの分類
    const noviceStandardRatio =
      (57 / (35 + 28 + 57)) * 100; // 57.58%
    const experiencedStandardRatio =
      (104 / (8 + 6 + 104)) * 100; // 88.14%

    const result = compareAssessorAccuracy(comparisonParams);

    // 定量指標の検証
    expect(result.accuracyGapPercentage).toBe(16.0);
    expect(result.agreementGapPercentage).toBe(14.0);
    expect(result.scoreGapPoints).toBe(16);
    expect(result.assessmentTimeGapMinutes).toBe(10);
    expect(result.correctionRateGapPercentage).toBe(11.0);

    // 能力レベル判定
    // 新人: accuracyRate < 85% かつ correctionRate > 10% → "developing"
    // 経験者: accuracyRate >= 90% かつ correctionRate <= 5% → "expert"
    expect(result.noviceAbilityLevel).toBe("developing");
    expect(result.experiencedAbilityLevel).toBe("expert");

    // 相場乖離パターン分析
    expect(result.noviceStandardRatioPercentage).toBeCloseTo(57.58, 1);
    expect(result.experiencedStandardRatioPercentage).toBeCloseTo(88.14, 1);
    expect(result.deviationPatternDifferencePercentage).toBeCloseTo(
      88.14 - 57.58,
      1
    );

    // 改善優先度スコアの計算
    // 優先度スコア = (能力差 + 実務インパクト) × 改善効果期待値
    // 正確性率の差: 16% × 50点 = 800点
    // 修正率の差: 11% × 40点 = 440点
    // 合計スコア (800 + 440) / 2 = 620点
    const expectedPriorityScore =
      ((16.0 * 50 + 11.0 * 40) / 2) * 0.5; // 310点
    expect(result.improvementPriorityScore).toBeCloseTo(310, 1);

    // グラフ・チャート用のデータ検証
    expect(result.comparisonChartData).toBeDefined();
    expect(result.comparisonChartData.metrics).toEqual([
      "accuracyRate",
      "agreementRate",
      "averageScore",
      "assessmentTimeMinutes",
    ]);
    expect(result.comparisonChartData.noviceValues).toEqual([78.0, 82.0, 76, 28]);
    expect(result.comparisonChartData.experiencedValues).toEqual([
      94.0, 96.0, 92, 18,
    ]);

    // 詳細レポート検証
    expect(result.detailedReport).toBeDefined();
    expect(result.detailedReport.reportPeriod).toBe(
      `Last ${comparisonPeriodMonths} months`
    );
    expect(result.detailedReport.comparisonDate).toBeDefined();
    expect(result.detailedReport.assessmentCountDifference).toBe(118 - 120); // -2件

    // 個別判定差異の追跡可能性
    expect(result.detailedReport.deviationPatternsComparison).toBeDefined();
    expect(
      result.detailedReport.deviationPatternsComparison.noviceUnderestimated
    ).toBe(35);
    expect(
      result.detailedReport.deviationPatternsComparison.noviceOverestimated
    ).toBe(28);
    expect(
      result.detailedReport.deviationPatternsComparison.experiencedUnderestimated
    ).toBe(8);
    expect(
      result.detailedReport.deviationPatternsComparison.experiencedOverestimated
    ).toBe(6);

    // 定量的な能力差の識別可能性検証
    expect(result.quantitativeComparison).toBeDefined();
    expect(result.quantitativeComparison.accuracyImprovement).toBeCloseTo(
      (16.0 / 78.0) * 100,
      1
    ); // 20.51%の改善余地
    expect(result.quantitativeComparison.correctionRateImprovement).toBeCloseTo(
      (11.0 / 15.0) * 100,
      1
    ); // 73.33%の改善余地

    // グラフ描画用の可視化メタデータ
    expect(result.visualizationMetadata).toBeDefined();
    expect(result.visualizationMetadata.chartType).toBe("radar"); // レーダーチャート推奨
    expect(result.visualizationMetadata.colorSchemeNovice).toBe("orange");
    expect(result.visualizationMetadata.colorSchemeExperienced).toBe("green");

    // 結果の完全性検証
    expect(result).toHaveProperty("accuracyGapPercentage");
    expect(result).toHaveProperty("agreementGapPercentage");
    expect(result).toHaveProperty("scoreGapPoints");
    expect(result).toHaveProperty("assessmentTimeGapMinutes");
    expect(result).toHaveProperty("correctionRateGapPercentage");
    expect(result).toHaveProperty("noviceAbilityLevel");
    expect(result).toHaveProperty("experiencedAbilityLevel");
    expect(result).toHaveProperty("improvementPriorityScore");
    expect(result).toHaveProperty("comparisonChartData");
    expect(result).toHaveProperty("detailedReport");
    expect(result).toHaveProperty("quantitativeComparison");
    expect(result).toHaveProperty("visualizationMetadata");
  });
});
import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  generateModelImprovementReport,
  recordModelImprovementMetrics,
} from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1527: [normal] モデル改善実績自動記録・レポート生成機能
  test("再学習完了後の改善前後査定結果を自動比較し、OCR精度・AI判定精度・乖離パターンの変化を正しく記録", () => {
    // 再学習前の査定結果
    const preImprovementMetrics = {
      ocrAccuracy: 85,
      aiJudgmentAccuracy: 82,
      deviationPatternCount: 12,
      evaluationTimestamp: "2024-12-01T10:00:00Z",
      testDatasetSize: 500,
    };

    // 再学習用新規データセット（100件以上）
    const newTrainingDataset = {
      datasetId: "dataset_2024_12_new",
      recordCount: 150,
      sourceTypes: ["past_projects", "material_price_book"],
      regionCoverage: ["tokyo", "osaka", "nagoya"],
      constructionTypes: ["painting", "scaffolding", "excavation"],
      addedDate: "2024-12-10T09:00:00Z",
    };

    // 再学習完了後の査定結果
    const postImprovementMetrics = {
      ocrAccuracy: 89,
      aiJudgmentAccuracy: 87,
      deviationPatternCount: 8,
      evaluationTimestamp: "2024-12-15T14:30:00Z",
      testDatasetSize: 500,
    };

    // 記録対象の改善メトリクス
    const improvementRecord = {
      preRetrainingOcrAccuracy: preImprovementMetrics.ocrAccuracy,
      postRetrainingOcrAccuracy: postImprovementMetrics.ocrAccuracy,
      preRetrainingAiAccuracy: preImprovementMetrics.aiJudgmentAccuracy,
      postRetrainingAiAccuracy: postImprovementMetrics.aiJudgmentAccuracy,
      preRetrainingDeviationPatterns: preImprovementMetrics.deviationPatternCount,
      postRetrainingDeviationPatterns: postImprovementMetrics.deviationPatternCount,
      trainingDatasetId: newTrainingDataset.datasetId,
      trainingDatasetRecordCount: newTrainingDataset.recordCount,
      evaluationStartTime: preImprovementMetrics.evaluationTimestamp,
      evaluationEndTime: postImprovementMetrics.evaluationTimestamp,
      testDatasetSize: postImprovementMetrics.testDatasetSize,
    };

    // OCR精度の変化を記録・検証
    const ocrImprovementRate =
      ((postImprovementMetrics.ocrAccuracy -
        preImprovementMetrics.ocrAccuracy) /
        preImprovementMetrics.ocrAccuracy) *
      100;
    expect(ocrImprovementRate).toBe(4.705882352941177);

    // AI判定精度の変化を記録・検証
    const aiImprovementRate =
      ((postImprovementMetrics.aiJudgmentAccuracy -
        preImprovementMetrics.aiJudgmentAccuracy) /
        preImprovementMetrics.aiJudgmentAccuracy) *
      100;
    expect(aiImprovementRate).toBe(6.097560975609756);

    // 乖離パターン数の変化を記録・検証
    const deviationPatternReduction =
      preImprovementMetrics.deviationPatternCount -
      postImprovementMetrics.deviationPatternCount;
    expect(deviationPatternReduction).toBe(4);

    // recordModelImprovementMetrics 関数の実行
    const recordedMetrics = recordModelImprovementMetrics(improvementRecord);

    // 記録されたメトリクスの検証
    expect(recordedMetrics.preRetrainingOcrAccuracy).toBe(85);
    expect(recordedMetrics.postRetrainingOcrAccuracy).toBe(89);
    expect(recordedMetrics.preRetrainingAiAccuracy).toBe(82);
    expect(recordedMetrics.postRetrainingAiAccuracy).toBe(87);
    expect(recordedMetrics.preRetrainingDeviationPatterns).toBe(12);
    expect(recordedMetrics.postRetrainingDeviationPatterns).toBe(8);
    expect(recordedMetrics.trainingDatasetRecordCount).toBe(150);
    expect(recordedMetrics.testDatasetSize).toBe(500);
    expect(recordedMetrics.recordingTimestamp).toBeDefined();

    // 改善実績レポートの自動生成
    const reportInput = {
      improvementMetricsId: recordedMetrics.metricsId,
      preRetrainingOcrAccuracy: 85,
      postRetrainingOcrAccuracy: 89,
      preRetrainingAiAccuracy: 82,
      postRetrainingAiAccuracy: 87,
      preRetrainingDeviationPatterns: 12,
      postRetrainingDeviationPatterns: 8,
      trainingDatasetId: "dataset_2024_12_new",
      trainingDatasetRecordCount: 150,
      regionCoverage: ["tokyo", "osaka", "nagoya"],
      constructionTypes: ["painting", "scaffolding", "excavation"],
      evaluationStartTime: "2024-12-01T10:00:00Z",
      evaluationEndTime: "2024-12-15T14:30:00Z",
      testDatasetSize: 500,
    };

    const generatedReport = generateModelImprovementReport(reportInput);

    // 生成されたレポートの検証
    expect(generatedReport.reportId).toBeDefined();
    expect(generatedReport.reportGeneratedTimestamp).toBeDefined();

    // 改善前後の比較データが含まれていることを検証
    expect(generatedReport.comparisonData.ocrAccuracyImprovement).toBe(4);
    expect(generatedReport.comparisonData.aiAccuracyImprovement).toBe(5);
    expect(
      generatedReport.comparisonData.deviationPatternReduction
    ).toBe(4);

    // 精度向上の詳細が含まれていることを検証
    expect(
      generatedReport.accuracyImprovementDetails.ocrAccuracyImprovementRate
    ).toBeCloseTo(4.705882352941177, 5);
    expect(
      generatedReport.accuracyImprovementDetails.aiAccuracyImprovementRate
    ).toBeCloseTo(6.097560975609756, 5);

    // 乖離パターン分析が含まれていることを検証
    expect(
      generatedReport.deviationPatternAnalysis.preRetrainingPatternCount
    ).toBe(12);
    expect(
      generatedReport.deviationPatternAnalysis.postRetrainingPatternCount
    ).toBe(8);
    expect(
      generatedReport.deviationPatternAnalysis.patternReductionCount
    ).toBe(4);

    // トレーニングデータセット情報が含まれていることを検証
    expect(generatedReport.trainingDatasetInfo.datasetId).toBe(
      "dataset_2024_12_new"
    );
    expect(generatedReport.trainingDatasetInfo.recordCount).toBe(150);
    expect(generatedReport.trainingDatasetInfo.regionCoverage).toEqual([
      "tokyo",
      "osaka",
      "nagoya",
    ]);
    expect(generatedReport.trainingDatasetInfo.constructionTypes).toEqual([
      "painting",
      "scaffolding",
      "excavation",
    ]);

    // 履歴記録の検証
    expect(generatedReport.improvementHistoryRecord.metricsId).toBeDefined();
    expect(generatedReport.improvementHistoryRecord.reportId).toBeDefined();
    expect(
      generatedReport.improvementHistoryRecord.recordingTimestamp
    ).toBeDefined();
    expect(
      generatedReport.improvementHistoryRecord.preRetrainingOcrAccuracy
    ).toBe(85);
    expect(
      generatedReport.improvementHistoryRecord.postRetrainingOcrAccuracy
    ).toBe(89);
    expect(
      generatedReport.improvementHistoryRecord.preRetrainingAiAccuracy
    ).toBe(82);
    expect(
      generatedReport.improvementHistoryRecord.postRetrainingAiAccuracy
    ).toBe(87);

    // 全体的なレポート構造の検証
    expect(generatedReport.status).toBe("completed");
    expect(generatedReport.dataIntegrity).toBe(true);
  });
});
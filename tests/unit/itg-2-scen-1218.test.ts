import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  executeModelRetrainingWithDataAddition,
  adjustModelParameters,
  measurePrecisionMetrics,
  generatePrecisionImprovementReport,
  comparePrecisionBeforeAfter,
} from '../../src/logic/it-6-2-2-2';

const fetchMock = require('jest-fetch-mock');

describe('改善対策実行と精度計測機能 - 学習データ追加・モデル再学習・パラメータ調整', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1218
  test('改善対策実行時に学習データを追加してモデルを再学習し、パラメータ調整後の精度指標を自動計測・記録する', async () => {
    // ========== 前置条件: 改善前の精度指標を記録 ==========
    const baselinePrecisionAccuracy = 0.78;
    const baselinePrecisionRecall = 0.75;
    const baselinePrecisionF1Score = 0.765;
    const baselinePrecisionPrecision = 0.82;

    // ========== 新規学習データのアップロード・登録 ==========
    const newTrainingDataCount = 1200;
    const newTrainingDataCoverage = {
      region: ['Tokyo', 'Osaka', 'Nagoya', 'Fukuoka', 'Sapporo'],
      constructionType: ['Steel', 'Concrete', 'Composite', 'Wood', 'Other'],
      seasonalPeriod: ['Q1', 'Q2', 'Q3', 'Q4'],
    };

    const uploadTrainingDataResponse = {
      success: true,
      dataId: 'training_data_20250501_v2',
      recordsAdded: newTrainingDataCount,
      coverageGeometry: newTrainingDataCoverage,
      uploadTimestamp: '2025-05-01T09:00:00Z',
      status: 'ready_for_learning',
    };

    fetchMock.mockResponseOnce(JSON.stringify(uploadTrainingDataResponse), {
      status: 200,
    });

    const uploadResponse = await fetch('/api/training-data/upload', {
      method: 'POST',
      body: JSON.stringify({
        dataFile: 'new_training_data.csv',
        dataCount: newTrainingDataCount,
      }),
    });

    const uploadedData = await uploadResponse.json();
    expect(uploadedData.status).toBe('ready_for_learning');
    expect(uploadedData.recordsAdded).toBe(1200);

    // ========== モデル再学習の実行 ==========
    const retrainingExecuteResponse = {
      success: true,
      modelId: 'ai_model_v3.2',
      trainingSessionId: 'session_20250501_001',
      startTimestamp: '2025-05-01T09:15:00Z',
      estimatedDurationSeconds: 3600,
      status: 'learning_in_progress',
      progress: 0,
    };

    fetchMock.mockResponseOnce(JSON.stringify(retrainingExecuteResponse), {
      status: 200,
    });

    const retrainingStartResponse = await fetch('/api/model/retrain', {
      method: 'POST',
      body: JSON.stringify({
        trainingDataId: uploadedData.dataId,
        modelVersion: 'v3.1',
      }),
    });

    const retrainingSession = await retrainingStartResponse.json();
    expect(retrainingSession.status).toBe('learning_in_progress');
    expect(retrainingSession.trainingSessionId).toBe('session_20250501_001');

    // ========== 学習処理の完了待機とステータス確認 ==========
    const retrainingCompleteResponse = {
      success: true,
      modelId: 'ai_model_v3.2',
      trainingSessionId: 'session_20250501_001',
      status: 'completed',
      completionTimestamp: '2025-05-01T10:45:00Z',
      actualDurationSeconds: 5400,
      convergenceMetric: 0.0089,
    };

    fetchMock.mockResponseOnce(JSON.stringify(retrainingCompleteResponse), {
      status: 200,
    });

    const retrainingCheckResponse = await fetch(
      '/api/model/retrain/session_20250501_001',
      { method: 'GET' }
    );

    const retrainingStatus = await retrainingCheckResponse.json();
    expect(retrainingStatus.status).toBe('completed');
    expect(retrainingStatus.completionTimestamp).toBe('2025-05-01T10:45:00Z');

    // ========== パラメータ調整の実行 ==========
    const parameterAdjustmentInput = {
      modelId: 'ai_model_v3.2',
      learningRate: 0.002,
      epochCount: 50,
      batchSize: 32,
      regularizationLambda: 0.001,
      dropoutRate: 0.3,
      earlyStopping: true,
      earlyStoppingPatience: 5,
    };

    const parameterAdjustResponse = {
      success: true,
      modelId: 'ai_model_v3.2',
      adjustmentSessionId: 'param_session_20250501_001',
      appliedParameters: parameterAdjustmentInput,
      adjustmentTimestamp: '2025-05-01T11:00:00Z',
      status: 'applied',
    };

    fetchMock.mockResponseOnce(JSON.stringify(parameterAdjustResponse), {
      status: 200,
    });

    const parameterAdjustment = await adjustModelParameters(
      parameterAdjustmentInput
    );

    expect(parameterAdjustment.success).toBe(true);
    expect(parameterAdjustment.appliedParameters.learningRate).toBe(0.002);
    expect(parameterAdjustment.appliedParameters.epochCount).toBe(50);
    expect(parameterAdjustment.status).toBe('applied');

    // ========== 調整したパラメータで再度学習を実行 ==========
    const secondRetrainingResponse = {
      success: true,
      modelId: 'ai_model_v3.2_tuned',
      trainingSessionId: 'session_20250501_002',
      startTimestamp: '2025-05-01T11:10:00Z',
      estimatedDurationSeconds: 5400,
      status: 'learning_in_progress',
      progress: 0,
      parentSessionId: 'session_20250501_001',
    };

    fetchMock.mockResponseOnce(JSON.stringify(secondRetrainingResponse), {
      status: 200,
    });

    const secondRetrainingStart = await fetch('/api/model/retrain', {
      method: 'POST',
      body: JSON.stringify({
        trainingDataId: uploadedData.dataId,
        modelVersion: 'v3.2',
        parameterAdjustmentSessionId: parameterAdjustment.adjustmentSessionId,
      }),
    });

    const secondSession = await secondRetrainingStart.json();
    expect(secondSession.status).toBe('learning_in_progress');
    expect(secondSession.parentSessionId).toBe('session_20250501_001');

    // ========== 第2学習の完了を待機 ==========
    const secondRetrainingCompleteResponse = {
      success: true,
      modelId: 'ai_model_v3.2_tuned',
      trainingSessionId: 'session_20250501_002',
      status: 'completed',
      completionTimestamp: '2025-05-01T12:55:00Z',
      actualDurationSeconds: 5700,
      convergenceMetric: 0.0062,
    };

    fetchMock.mockResponseOnce(JSON.stringify(secondRetrainingCompleteResponse), {
      status: 200,
    });

    const secondRetrainingCheck = await fetch(
      '/api/model/retrain/session_20250501_002',
      { method: 'GET' }
    );

    const secondRetrainingStatus = await secondRetrainingCheck.json();
    expect(secondRetrainingStatus.status).toBe('completed');

    // ========== 改善後の精度指標を自動計測 ==========
    const improvedPrecisionAccuracy = 0.85;
    const improvedPrecisionRecall = 0.83;
    const improvedPrecisionF1Score = 0.84;
    const improvedPrecisionPrecision = 0.87;

    const measurePrecisionInput = {
      modelId: 'ai_model_v3.2_tuned',
      testDatasetId: 'test_dataset_validation_20250501',
      sampleSize: 2000,
      evaluationTimestamp: '2025-05-01T13:10:00Z',
    };

    const precisionMetricsResponse = {
      success: true,
      modelId: 'ai_model_v3.2_tuned',
      sessionId: 'eval_session_20250501_001',
      accuracy: improvedPrecisionAccuracy,
      recall: improvedPrecisionRecall,
      f1Score: improvedPrecisionF1Score,
      precision: improvedPrecisionPrecision,
      confidenceInterval: {
        lower: 0.84,
        upper: 0.86,
      },
      sampleCount: 2000,
      evaluationTimestamp: '2025-05-01T13:10:00Z',
      detailedMetrics: {
        macroAveragePrecision: 0.865,
        macroAverageRecall: 0.825,
        weightedAveragePrecision: 0.872,
        weightedAverageRecall: 0.830,
        rocAucScore: 0.91,
        confusionMatrixAccuracy: 0.85,
      },
    };

    const precisionMetrics = await measurePrecisionMetrics(
      measurePrecisionInput
    );

    expect(precisionMetrics.accuracy).toBe(0.85);
    expect(precisionMetrics.recall).toBe(0.83);
    expect(precisionMetrics.f1Score).toBe(0.84);
    expect(precisionMetrics.precision).toBe(0.87);
    expect(precisionMetrics.detailedMetrics.rocAucScore).toBe(0.91);

    // ========== 改善前後の精度指標を自動比較 ==========
    const comparisonInput = {
      baselineAccuracy: baselinePrecisionAccuracy,
      baselineRecall: baselinePrecisionRecall,
      baselineF1Score: baselinePrecisionF1Score,
      baselinePrecision: baselinePrecisionPrecision,
      improvedAccuracy: improvedPrecisionAccuracy,
      improvedRecall: improvedPrecisionRecall,
      improvedF1Score: improvedPrecisionF1Score,
      improvedPrecision: improvedPrecisionPrecision,
      evaluationTimestamp: '2025-05-01T13:15:00Z',
    };

    const precisionComparison = await comparePrecisionBeforeAfter(
      comparisonInput
    );

    // ========== 改善度の具体的な計算と検証 ==========
    const accuracyImprovementRate =
      ((improvedPrecisionAccuracy - baselinePrecisionAccuracy) /
        baselinePrecisionAccuracy) *
      100;
    const recallImprovementRate =
      ((improvedPrecisionRecall - baselinePrecisionRecall) /
        baselinePrecisionRecall) *
      100;
    const f1ImprovementRate =
      ((improvedPrecisionF1Score - baselinePrecisionF1Score) /
        baselinePrecisionF1Score) *
      100;
    const precisionImprovementRate =
      ((improvedPrecisionPrecision - baselinePrecisionPrecision) /
        baselinePrecisionPrecision) *
      100;

    expect(precisionComparison.accuracyImprovementRate).toBeCloseTo(
      accuracyImprovementRate,
      1
    );
    expect(precisionComparison.recallImprovementRate).toBeCloseTo(
      recallImprovementRate,
      1
    );
    expect(precisionComparison.f1ImprovementRate).toBeCloseTo(
      f1ImprovementRate,
      1
    );
    expect(precisionComparison.precisionImprovementRate).toBeCloseTo(
      precisionImprovementRate,
      1
    );

    // 改善度のサマリーを検証（改善が確認されたことを確認）
    expect(precisionComparison.overallImprovementRating).toMatch(
      /significant|notable|moderate/i
    );

    // ========== 精度改善レポートの自動生成 ==========
    const reportGenerationInput = {
      baselineSessionId: 'session_20250501_001',
      improvedSessionId: 'session_20250501_002',
      trainingDataId: uploadedData.dataId,
      parameterAdjustmentSessionId: parameterAdjustment.adjustmentSessionId,
      baselineMetrics: {
        accuracy: baselinePrecisionAccuracy,
        recall: baselinePrecisionRecall,
        f1Score: baselinePrecisionF1Score,
        precision: baselinePrecisionPrecision,
      },
      improvedMetrics: {
        accuracy: improvedPrecisionAccuracy,
        recall: improvedPrecisionRecall,
        f1Score: improvedPrecisionF1Score,
        precision: improvedPrecisionPrecision,
      },
      generationTimestamp: '2025-05-01T13:30:00Z',
    };

    const reportGenerationResponse = {
      success: true,
      reportId: 'report_20250501_precision_improvement_v1',
      reportTitle: '精度改善レポート - モデル v3.2_tuned',
      generationTimestamp: '2025-05-01T13:30:00Z',
      contents: {
        executive_summary: {
          overall_improvement_percentage: 9.0,
          status: 'significant_improvement',
          recommendation: 'deploy_to_production',
        },
        detailed_metrics: {
          accuracy_change: {
            baseline: 0.78,
            improved: 0.85,
            absolute_change: 0.07,
            percentage_change: 8.97,
          },
          recall_change: {
            baseline: 0.75,
            improved: 0.83,
            absolute_change: 0.08,
            percentage_change: 10.67,
          },
          f1_score_change: {
            baseline: 0.765,
            improved: 0.84,
            absolute_change: 0.075,
            percentage_change: 9.8,
          },
          precision_change: {
            baseline: 0.82,
            improved: 0.87,
            absolute_change: 0.05,
            percentage_change: 6.1,
          },
        },
        training_details: {
          training_data_records_added: 1200,
          regional_coverage: 5,
          construction_type_coverage: 5,
          seasonal_period_coverage: 4,
          training_duration_seconds: 5700,
          parameter_adjustments_applied: 8,
        },
        quality_assessment: {
          confidence_interval_lower: 0.84,
          confidence_interval_upper: 0.86,
          statistical_significance: 'p_value_0.0001',
          sample_size: 2000,
          roc_auc_score: 0.91,
        },
        charts_and_visualization_data: {
          accuracy_trend_chart: 'chart_data_accuracy_comparison_20250501',
          recall_trend_chart: 'chart_data_recall_comparison_20250501',
          f1_score_trend_chart: 'chart_data_f1_comparison_20250501',
          confusion_matrix_before: 'confusion_matrix_baseline_v3.1',
          confusion_matrix_after: 'confusion_matrix_improved_v3.2_tuned',
          parameter_impact_heatmap:
            'heatmap_parameter_impact_learning_rate_epochs',
        },
      },
      recordingStatus: 'recorded_in_system',
      downloadFormat: ['pdf', 'csv', 'json'],
      recordId: 'precision_report_record_20250501_001',
    };

    const generatedReport = await generatePrecisionImprovementReport(
      reportGenerationInput
    );

    expect(generatedReport.success).toBe(true);
    expect(generatedReport.reportId).toBe(
      'report_20250501_precision_improvement_v1'
    );
    expect(generatedReport.contents.executive_summary.status).toBe(
      'significant_improvement'
    );
    expect(generatedReport.contents.executive_summary.recommendation).toBe(
      'deploy_to_production'
    );

    // ========== レポート内容の詳細検証 ==========
    expect(
      generatedReport.contents.detailed_metrics.accuracy_change.improved
    ).toBe(0.85);
    expect(
      generatedReport.contents.detailed_metrics.accuracy_change.baseline
    ).toBe(0.78);
    expect(
      generatedReport.contents.detailed_metrics.accuracy_change.percentage_change
    ).toBeCloseTo(8.97, 1);

    expect(
      generatedReport.contents.detailed_metrics.recall_change.improved
    ).toBe(0.83);
    expect(
      generatedReport.contents.detailed_metrics.recall_change.percentage_change
    ).toBeCloseTo(10.67, 1);

    expect(generatedReport.contents.detailed_metrics.f1_score_change.improved).toBe(
      0.84
    );
    expect(
      generatedReport.contents.detailed_metrics.f1_score_change.percentage_change
    ).toBeCloseTo(9.8, 1);

    expect(
      generatedReport.contents.detailed_metrics.precision_change.improved
    ).toBe(0.87);
    expect(
      generatedReport.contents.detailed_metrics.precision_change.percentage_change
    ).toBeCloseTo(6.1, 1);

    // ========== 学習データとパラメータ調整の記録を検証 ==========
    expect(generatedReport.contents.training_details.training_data_records_added).toBe(
      1200
    );
    expect(generatedReport.contents.training_details.regional_coverage).toBe(5);
    expect(
      generatedReport.contents.training_details.construction_type_coverage
    ).toBe(5);
    expect(generatedReport.contents.training_details.seasonal_period_coverage).toBe(
      4
    );
    expect(
      generatedReport.contents.training_details.parameter_adjustments_applied
    ).toBe(8);

    // ========== 品質指標の検証 ==========
    expect(
      generatedReport.contents.quality_assessment.confidence_interval_lower
    ).toBe(0.84);
    expect(
      generatedReport.contents.quality_assessment.confidence_interval_upper
    ).toBe(0.86);
    expect(generatedReport.contents.quality_assessment.roc_auc_score).toBe(
      0.91
    );
    expect(generatedReport.contents.quality_assessment.sample_size).toBe(2000);

    // ========== チャートとビジュアライゼーションデータの確認 ==========
    expect(
      generatedReport.contents.charts_and_visualization_data.accuracy_trend_chart
    ).toBe('chart_data_accuracy_comparison_20250501');
    expect(
      generatedReport.contents.charts_and_visualization_data
        .confusion_matrix_before
    ).toBe('confusion_matrix_baseline_v3.1');
    expect(
      generatedReport.contents.charts_and_visualization_data
        .confusion_matrix_after
    ).toBe('confusion_matrix_improved_v3.2_tuned');

    // ========== レポートの記録状態を確認 ==========
    expect(generatedReport.recordingStatus).toBe('recorded_in_system');
    expect(generatedReport.recordId).toBe('precision_report_record_20250501_001');

    // ========== レポートのダウンロード形式を確認 ==========
    expect(generatedReport.downloadFormat).toContain('pdf');
    expect(generatedReport.downloadFormat).toContain('csv');
    expect(generatedReport.downloadFormat).toContain('json');
    expect(generatedReport.downloadFormat.length).toBe(3);

    // ========== レポートのダウンロード・エクスポート機能の確認 ==========
    const exportFormats = ['pdf', 'csv', 'json'];

    for (const format of exportFormats) {
      const downloadResponse = {
        success: true,
        reportId: generatedReport.reportId,
        format: format,
        downloadUrl: `https://system.example.com/reports/${generatedReport.reportId}/download?format=${format}`,
        downloadTimestamp: '2025-05-01T13:45:00Z',
        fileSize: format === 'pdf' ? 2500000 : format === 'csv' ? 850000 : 1200000,
        fileHash: `hash_${format}_20250501`,
      };

      fetchMock.mockResponseOnce(JSON.stringify(downloadResponse), {
        status: 200,
      });

      const exportResponse = await fetch(
        `/api/reports/${generatedReport.reportId}/export`,
        {
          method: 'POST',
          body: JSON.stringify({ format }),
        }
      );

      const exportData = await exportResponse.json();

      expect(exportData.success).toBe(true);
      expect(exportData.format).toBe(format);
      expect(exportData.downloadUrl).toContain(generatedReport.reportId);
      expect(exportData.downloadUrl).toContain(format);
      expect(exportData.fileSize).toBeGreaterThan(0);
    }

    // ========== 最終的な状態確認：改善対策実行の全プロセスが正常に完了したことを検証 ==========
    expect(uploadedData.status).toBe('ready_for_learning');
    expect(retrainingStatus.status).toBe('completed');
    expect(parameterAdjustment.status).toBe('applied');
    expect(secondRetrainingStatus.status).toBe('completed');
    expect(precisionMetrics.accuracy).toBeGreaterThan(baselinePrecisionAccuracy);
    expect(precisionMetrics.recall).toBeGreaterThan(baselinePrecisionRecall);
    expect(precisionMetrics.f1Score).toBeGreaterThan(baselinePrecisionF1Score);
    expect(precisionMetrics.precision).toBeGreaterThan(baselinePrecisionPrecision);
    expect(generatedReport.success).toBe(true);
    expect(generatedReport.recordingStatus).toBe('recorded_in_system');
  });
});
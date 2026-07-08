import { aggregateMonthlyImprovementReport } from '../../src/logic/it-6-2-1-1';

describe('改善実績月次レポート自動集計と可視化', () => {
  // SCEN-1515: [normal] 改善実績月次レポート自動集計 - 過去案件データ更新内容、OCR・AI判定精度改善度、査定件数短縮率、品質均一化指標を自動集計し月次レポートとして可視化
  test('should auto-aggregate and visualize monthly improvement report with all four indicators', () => {
    // 入力: 3ヶ月間の運用実績データを想定した月次評価対象期間
    const reportInput = {
      evaluationMonth: '2024-01',
      assessmentExecutionStartDate: '2024-01-01',
      assessmentExecutionEndDate: '2024-01-31',
      pastCaseDataUpdates: {
        addedCaseCount: 145,
        addedRegionCategories: ['関東', '中部', '関西'],
        addedConstructionTypes: ['鉄骨造', '鋼管鉄筋コンクリート造'],
        addedSeasonalPatterns: ['冬季', '年末'],
        totalUpdatedRecordCount: 520,
      },
      ocrPrecisionBaseline: {
        previousMonthAccuracy: 88.5,
        currentMonthAccuracy: 91.2,
      },
      aiJudgmentPrecisionBaseline: {
        previousMonthAccuracy: 85.3,
        currentMonthAccuracy: 88.7,
      },
      assessmentCompletionTimeData: {
        previousMonthAverageSeconds: 1240,
        currentMonthAverageSeconds: 1089,
        totalAssessmentCount: 487,
      },
      assessorJudgmentVarianceData: {
        previousMonthVarianceRate: 12.4,
        currentMonthVarianceRate: 8.6,
        assessorCount: 30,
      },
    };

    const result = aggregateMonthlyImprovementReport(reportInput);

    // 期待値: 過去案件データ更新内容の集計
    expect(result.pastCaseDataUpdateSummary).toEqual({
      addedCaseCount: 145,
      addedRegionCategoryCount: 3,
      addedConstructionTypeCount: 2,
      addedSeasonalPatternCount: 2,
      totalUpdatedRecordCount: 520,
    });

    // 期待値: OCR読取精度改善度の集計
    // 計算式: (91.2 - 88.5) / 88.5 * 100 = 3.05%
    expect(result.ocrPrecisionImprovement).toEqual({
      previousAccuracy: 88.5,
      currentAccuracy: 91.2,
      improvementRate: 3.05,
      improvementGrade: 'A',
    });

    // 期待値: AI判定精度改善度の集計
    // 計算式: (88.7 - 85.3) / 85.3 * 100 = 3.99%
    expect(result.aiJudgmentPrecisionImprovement).toEqual({
      previousAccuracy: 85.3,
      currentAccuracy: 88.7,
      improvementRate: 3.99,
      improvementGrade: 'A',
    });

    // 期待値: 査定件数短縮率の集計
    // 計算式: (1240 - 1089) / 1240 * 100 = 12.18%
    expect(result.assessmentCompletionTimeReduction).toEqual({
      previousAverageSeconds: 1240,
      currentAverageSeconds: 1089,
      reductionRate: 12.18,
      totalAssessmentCount: 487,
      totalTimeSavedSeconds: Math.round((1240 - 1089) * 487),
    });

    // 期待値: 品質均一化指標の集計
    // 計算式: (12.4 - 8.6) / 12.4 * 100 = 30.65%
    expect(result.qualityUniformityImprovement).toEqual({
      previousVarianceRate: 12.4,
      currentVarianceRate: 8.6,
      improvementRate: 30.65,
      assessorCount: 30,
      uniformityGrade: 'A',
    });

    // 期待値: 月次レポートメタデータの検証
    expect(result.reportMetadata).toEqual({
      evaluationMonth: '2024-01',
      reportGeneratedDate: expect.any(String),
      reportFormat: 'JSON',
      visualizationSupported: true,
      downloadFormats: ['PDF', 'CSV', 'Excel'],
    });

    // 期待値: 月次レポートの完全性チェック
    expect(result.completenessCheck).toEqual({
      allIndicatorsPresent: true,
      allCalculationsValid: true,
      visualizationReady: true,
      downloadReady: true,
    });

    // 期待値: 集計指標の相互整合性チェック
    expect(result.dataIntegrityValidation).toEqual({
      pastCaseDataIntegrity: true,
      ocrPrecisionIntegrity: true,
      aiJudgmentPrecisionIntegrity: true,
      assessmentTimeIntegrity: true,
      qualityUniformityIntegrity: true,
      overallDataQuality: 'PASS',
    });

    // 期待値: グラフ・チャート生成指示
    expect(result.visualizationInstructions).toEqual({
      ocrPrecisionChart: {
        chartType: 'LineChart',
        dataPoints: 2,
        xAxisLabel: 'Month',
        yAxisLabel: 'Accuracy %',
        title: 'OCR Precision Improvement Trend',
      },
      aiJudgmentChart: {
        chartType: 'LineChart',
        dataPoints: 2,
        xAxisLabel: 'Month',
        yAxisLabel: 'Accuracy %',
        title: 'AI Judgment Precision Improvement Trend',
      },
      completionTimeChart: {
        chartType: 'BarChart',
        dataPoints: 2,
        xAxisLabel: 'Month',
        yAxisLabel: 'Average Time (seconds)',
        title: 'Assessment Completion Time Reduction',
      },
      qualityUniformityChart: {
        chartType: 'LineChart',
        dataPoints: 2,
        xAxisLabel: 'Month',
        yAxisLabel: 'Variance Rate %',
        title: 'Quality Uniformity Improvement Trend',
      },
    });

    // 期待値: レポート出力フォーマット
    expect(result.reportOutput).toEqual({
      format: 'STRUCTURED_JSON',
      isExportable: true,
      exportFormats: expect.arrayContaining(['PDF', 'CSV', 'Excel']),
      fileNamePattern: expect.stringMatching(/improvement_report_2024_01/),
    });

    // 期待値: レポート全体の構造検証
    expect(result).toHaveProperty('pastCaseDataUpdateSummary');
    expect(result).toHaveProperty('ocrPrecisionImprovement');
    expect(result).toHaveProperty('aiJudgmentPrecisionImprovement');
    expect(result).toHaveProperty('assessmentCompletionTimeReduction');
    expect(result).toHaveProperty('qualityUniformityImprovement');
    expect(result).toHaveProperty('reportMetadata');
    expect(result).toHaveProperty('completenessCheck');
    expect(result).toHaveProperty('dataIntegrityValidation');
    expect(result).toHaveProperty('visualizationInstructions');
    expect(result).toHaveProperty('reportOutput');

    // 期待値: 各改善指標の有意性判定
    expect(result.significanceJudgment).toEqual({
      ocrPrecisionSignificant: true,
      aiJudgmentPrecisionSignificant: true,
      completionTimeReductionSignificant: true,
      qualityUniformitySignificant: true,
      overallImprovementSignificant: true,
    });

    // 期待値: 月次レポートの最終ステータス
    expect(result.reportStatus).toBe('READY_FOR_DISTRIBUTION');
    expect(result.readyForDownload).toBe(true);
  });
});
import { calculatePrecisionMetrics } from '../../src/logic/it-6-2-1-1';

describe('モデル更新後精度測定機能 - 査定員別・工種別・金額帯別の判定精度指標自動集計', () => {
  // SCEN-1137: モデル再学習完了後のOCR読取精度とAI判定精度を定量計測できる
  test('should compute OCR and AI judgment precision metrics after model retraining', () => {
    // Arrange: テスト用の査定品データセットを準備
    const testDataset = {
      datasetId: 'test_ds_20240115_001',
      totalCount: 100,
      createdAt: new Date('2024-01-15T09:00:00Z'),
      samples: [
        {
          sampleId: 's_001',
          constructionType: '鉄骨造',
          amountBand: '100万-500万',
          region: '東京都',
          originalText: '単価:15000円/㎡',
          expectedOcrResult: '15000',
          expectedJudgmentResult: 'accept',
        },
        {
          sampleId: 's_002',
          constructionType: '鉄筋コンクリート造',
          amountBand: '500万-1000万',
          region: '大阪府',
          originalText: '単価:22000円/㎡',
          expectedOcrResult: '22000',
          expectedJudgmentResult: 'accept',
        },
        {
          sampleId: 's_003',
          constructionType: '木造',
          amountBand: '50万-100万',
          region: '名古屋市',
          originalText: '単価:8500円/㎡',
          expectedOcrResult: '8500',
          expectedJudgmentResult: 'accept',
        },
        {
          sampleId: 's_004',
          constructionType: '鉄骨造',
          amountBand: '1000万以上',
          region: '東京都',
          originalText: '単価:18000円/㎡',
          expectedOcrResult: '18000',
          expectedJudgmentResult: 'reject',
        },
        {
          sampleId: 's_005',
          constructionType: '鉄筋コンクリート造',
          amountBand: '100万-500万',
          region: '福岡県',
          originalText: '単価:21000円/㎡',
          expectedOcrResult: '21000',
          expectedJudgmentResult: 'accept',
        },
      ],
    };

    // モデル再学習処理を実行したことを示す入力
    const modelRetrainingInput = {
      modelVersionBefore: 'v1.2.0',
      modelVersionAfter: 'v1.3.0',
      trainingDataCount: 5000,
      retrainingCompletedAt: new Date('2024-01-15T10:30:00Z'),
      learningDataUpdates: {
        pastProjectDataAdded: 250,
        priceTableVersions: ['2024_01', '2024_02'],
      },
    };

    // OCR読取実行結果（テストデータセット対象）
    const ocrExecutionResult = {
      executionId: 'ocr_exec_20240115_001',
      startedAt: new Date('2024-01-15T11:00:00Z'),
      completedAt: new Date('2024-01-15T11:05:00Z'),
      totalProcessed: 5,
      results: [
        {
          sampleId: 's_001',
          ocrOutput: '15000',
          correct: true,
        },
        {
          sampleId: 's_002',
          ocrOutput: '22000',
          correct: true,
        },
        {
          sampleId: 's_003',
          ocrOutput: '8500',
          correct: true,
        },
        {
          sampleId: 's_004',
          ocrOutput: '18000',
          correct: true,
        },
        {
          sampleId: 's_005',
          ocrOutput: '21000',
          correct: true,
        },
      ],
    };

    // AI判定実行結果（テストデータセット対象）
    const aiJudgmentExecutionResult = {
      executionId: 'ai_judge_exec_20240115_001',
      startedAt: new Date('2024-01-15T11:05:30Z'),
      completedAt: new Date('2024-01-15T11:08:00Z'),
      totalProcessed: 5,
      results: [
        {
          sampleId: 's_001',
          judgmentOutput: 'accept',
          correct: true,
        },
        {
          sampleId: 's_002',
          judgmentOutput: 'accept',
          correct: true,
        },
        {
          sampleId: 's_003',
          judgmentOutput: 'accept',
          correct: true,
        },
        {
          sampleId: 's_004',
          judgmentOutput: 'reject',
          correct: true,
        },
        {
          sampleId: 's_005',
          judgmentOutput: 'accept',
          correct: true,
        },
      ],
    };

    // Act: 精度メトリクスを計算
    const precisionReport = calculatePrecisionMetrics({
      testDataset,
      modelRetrainingInput,
      ocrExecutionResult,
      aiJudgmentExecutionResult,
    });

    // Assert: OCR読取精度メトリクスを検証
    // OCR: 5件中5件正解 → 正答率 100%
    expect(precisionReport.ocrMetrics.accuracy).toBe(100.0);
    expect(precisionReport.ocrMetrics.precision).toBe(100.0);
    expect(precisionReport.ocrMetrics.recall).toBe(100.0);
    expect(precisionReport.ocrMetrics.fScore).toBe(100.0);
    expect(precisionReport.ocrMetrics.totalSamples).toBe(5);
    expect(precisionReport.ocrMetrics.correctCount).toBe(5);
    expect(precisionReport.ocrMetrics.incorrectCount).toBe(0);

    // Assert: AI判定精度メトリクスを検証
    // AI判定: 5件中5件正解 → 正答率 100%
    expect(precisionReport.aiJudgmentMetrics.accuracy).toBe(100.0);
    expect(precisionReport.aiJudgmentMetrics.precision).toBe(100.0);
    expect(precisionReport.aiJudgmentMetrics.recall).toBe(100.0);
    expect(precisionReport.aiJudgmentMetrics.fScore).toBe(100.0);
    expect(precisionReport.aiJudgmentMetrics.totalSamples).toBe(5);
    expect(precisionReport.aiJudgmentMetrics.correctCount).toBe(5);
    expect(precisionReport.aiJudgmentMetrics.incorrectCount).toBe(0);

    // Assert: レポートメタデータを検証
    expect(precisionReport.reportMetadata.measurementExecutionId).toMatch(/precision_report_/);
    expect(precisionReport.reportMetadata.measurementStartedAt).toEqual(
      new Date('2024-01-15T11:00:00Z')
    );
    expect(precisionReport.reportMetadata.measurementCompletedAt).toEqual(
      new Date('2024-01-15T11:08:00Z')
    );
    expect(precisionReport.reportMetadata.testDatasetId).toBe('test_ds_20240115_001');
    expect(precisionReport.reportMetadata.testDatasetCount).toBe(5);
    expect(precisionReport.reportMetadata.modelVersionBefore).toBe('v1.2.0');
    expect(precisionReport.reportMetadata.modelVersionAfter).toBe('v1.3.0');

    // Assert: 前回測定結果との比較情報を検証
    expect(precisionReport.comparisonWithPreviousMeasurement).toBeDefined();
    expect(precisionReport.comparisonWithPreviousMeasurement.accuracyImprovement).toBe(0.0);
    expect(precisionReport.comparisonWithPreviousMeasurement.improvementStatus).toBe('stable');

    // Assert: 構成タイプ別の精度集計を検証
    expect(precisionReport.metricsByConstructionType).toBeDefined();
    expect(Object.keys(precisionReport.metricsByConstructionType).length).toBeGreaterThan(0);

    // 鉄骨造: 2件中2件正解
    expect(precisionReport.metricsByConstructionType['鉄骨造'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByConstructionType['鉄骨造'].totalSamples).toBe(2);
    expect(precisionReport.metricsByConstructionType['鉄骨造'].correctCount).toBe(2);

    // 鉄筋コンクリート造: 2件中2件正解
    expect(precisionReport.metricsByConstructionType['鉄筋コンクリート造'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByConstructionType['鉄筋コンクリート造'].totalSamples).toBe(2);
    expect(precisionReport.metricsByConstructionType['鉄筋コンクリート造'].correctCount).toBe(2);

    // 木造: 1件中1件正解
    expect(precisionReport.metricsByConstructionType['木造'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByConstructionType['木造'].totalSamples).toBe(1);
    expect(precisionReport.metricsByConstructionType['木造'].correctCount).toBe(1);

    // Assert: 金額帯別の精度集計を検証
    expect(precisionReport.metricsByAmountBand).toBeDefined();
    expect(Object.keys(precisionReport.metricsByAmountBand).length).toBeGreaterThan(0);

    // 100万-500万: 2件中2件正解
    expect(precisionReport.metricsByAmountBand['100万-500万'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByAmountBand['100万-500万'].totalSamples).toBe(2);

    // 500万-1000万: 1件中1件正解
    expect(precisionReport.metricsByAmountBand['500万-1000万'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByAmountBand['500万-1000万'].totalSamples).toBe(1);

    // 50万-100万: 1件中1件正解
    expect(precisionReport.metricsByAmountBand['50万-100万'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByAmountBand['50万-100万'].totalSamples).toBe(1);

    // 1000万以上: 1件中1件正解
    expect(precisionReport.metricsByAmountBand['1000万以上'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByAmountBand['1000万以上'].totalSamples).toBe(1);

    // Assert: 地域別の精度集計を検証
    expect(precisionReport.metricsByRegion).toBeDefined();
    expect(Object.keys(precisionReport.metricsByRegion).length).toBeGreaterThan(0);

    // 東京都: 2件中2件正解
    expect(precisionReport.metricsByRegion['東京都'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByRegion['東京都'].totalSamples).toBe(2);

    // 大阪府: 1件中1件正解
    expect(precisionReport.metricsByRegion['大阪府'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByRegion['大阪府'].totalSamples).toBe(1);

    // 名古屋市: 1件中1件正解
    expect(precisionReport.metricsByRegion['名古屋市'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByRegion['名古屋市'].totalSamples).toBe(1);

    // 福岡県: 1件中1件正解
    expect(precisionReport.metricsByRegion['福岡県'].accuracy).toBe(100.0);
    expect(precisionReport.metricsByRegion['福岡県'].totalSamples).toBe(1);

    // Assert: レポート出力形式を検証
    expect(precisionReport.reportGeneratedAt).toEqual(expect.any(Date));
    expect(precisionReport.isComparable).toBe(true);
  });
});
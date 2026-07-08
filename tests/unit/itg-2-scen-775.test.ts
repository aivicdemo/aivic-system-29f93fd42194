import { calculatePrecisionMetrics } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-775: [edge] OCR精度・AI判定精度監視ダッシュボード - 精度実績データが1件のみの境界値で精度指標が算出される
  test('精度実績データが1件のみの場合、OCR精度指標およびAI判定精度指標が正常に算出され、その値がデータベース内の唯一のレコード値と一致する', () => {
    // Arrange
    const single_precision_record = {
      id: 1,
      assessor_id: 'ASSESSOR_001',
      work_type: '型枠工事',
      amount_bracket: '1000000_5000000',
      ocr_accuracy: 92.5,
      ai_judgment_accuracy: 88.3,
      measurement_date: new Date('2024-01-15T10:30:00Z'),
      sample_count: 150,
    };

    const precision_records = [single_precision_record];

    // Act
    const result = calculatePrecisionMetrics(precision_records);

    // Assert
    // OCR精度指標が1件のみのデータから正常に算出される
    expect(result.ocr_precision_metrics).toBeDefined();
    expect(result.ocr_precision_metrics.average_accuracy).toBe(92.5);
    expect(result.ocr_precision_metrics.min_accuracy).toBe(92.5);
    expect(result.ocr_precision_metrics.max_accuracy).toBe(92.5);
    expect(result.ocr_precision_metrics.sample_count).toBe(1);

    // AI判定精度指標が1件のみのデータから正常に算出される
    expect(result.ai_judgment_metrics).toBeDefined();
    expect(result.ai_judgment_metrics.average_accuracy).toBe(88.3);
    expect(result.ai_judgment_metrics.min_accuracy).toBe(88.3);
    expect(result.ai_judgment_metrics.max_accuracy).toBe(88.3);
    expect(result.ai_judgment_metrics.sample_count).toBe(1);

    // 単一レコードの値と算出された指標値が一致する
    expect(result.ocr_precision_metrics.average_accuracy).toEqual(single_precision_record.ocr_accuracy);
    expect(result.ai_judgment_metrics.average_accuracy).toEqual(single_precision_record.ai_judgment_accuracy);

    // グラフ生成用メタデータが正常に生成される
    expect(result.chart_metadata).toBeDefined();
    expect(result.chart_metadata.is_renderable).toBe(true);
    expect(result.chart_metadata.data_points_count).toBe(1);

    // エラーおよび警告ログが存在しない
    expect(result.error_logs).toBeDefined();
    expect(result.error_logs.length).toBe(0);
    expect(result.warning_logs).toBeDefined();
    expect(result.warning_logs.length).toBe(0);

    // 査定担当者別の精度指標が集計される
    expect(result.by_assessor_metrics).toBeDefined();
    expect(result.by_assessor_metrics['ASSESSOR_001']).toBeDefined();
    expect(result.by_assessor_metrics['ASSESSOR_001'].ocr_average).toBe(92.5);
    expect(result.by_assessor_metrics['ASSESSOR_001'].ai_judgment_average).toBe(88.3);

    // 工種別の精度指標が集計される
    expect(result.by_work_type_metrics).toBeDefined();
    expect(result.by_work_type_metrics['型枠工事']).toBeDefined();
    expect(result.by_work_type_metrics['型枠工事'].ocr_average).toBe(92.5);
    expect(result.by_work_type_metrics['型枠工事'].ai_judgment_average).toBe(88.3);

    // 金額帯別の精度指標が集計される
    expect(result.by_amount_bracket_metrics).toBeDefined();
    expect(result.by_amount_bracket_metrics['1000000_5000000']).toBeDefined();
    expect(result.by_amount_bracket_metrics['1000000_5000000'].ocr_average).toBe(92.5);
    expect(result.by_amount_bracket_metrics['1000000_5000000'].ai_judgment_average).toBe(88.3);

    // 標準偏差が正確に計算される（1件のみの場合は0）
    expect(result.ocr_precision_metrics.std_dev).toBe(0);
    expect(result.ai_judgment_metrics.std_dev).toBe(0);

    // ダッシュボード表示用の統計情報が生成される
    expect(result.dashboard_stats).toBeDefined();
    expect(result.dashboard_stats.total_records_processed).toBe(1);
    expect(result.dashboard_stats.timestamp).toBeDefined();
    expect(typeof result.dashboard_stats.timestamp).toBe('string');
  });
});
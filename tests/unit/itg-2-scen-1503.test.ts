import { calculatePrecisionImprovementMetrics } from '../../src/logic/it-6-2-2-2';

describe('改善前後精度計測・可視化機能', () => {
  test('SCEN-1503: AI判定モデル再学習完了後、改善前後のOCR精度・AI判定精度を自動計測し、改善度を数値とグラフで可視化する', () => {
    // 改善前の精度データ
    const pre_improvement_ocr_accuracy = 82.5;
    const pre_improvement_ai_judgment_accuracy = 78.3;

    // 改善後の精度データ
    const post_improvement_ocr_accuracy = 89.7;
    const post_improvement_ai_judgment_accuracy = 86.9;

    // テスト用の学習データセット情報
    const learning_dataset_info = {
      dataset_id: 'ds_20240315_001',
      data_count: 5420,
      training_period_start: '2024-01-01',
      training_period_end: '2024-03-14',
      regions_covered: ['東京', '大阪', '愛知', '福岡'],
      construction_types: ['建築', '土木', '設備'],
      retraining_completion_datetime: '2024-03-15T14:32:00Z'
    };

    // 改善前後精度計測・可視化機能を呼び出す
    const result = calculatePrecisionImprovementMetrics({
      pre_ocr_accuracy: pre_improvement_ocr_accuracy,
      post_ocr_accuracy: post_improvement_ocr_accuracy,
      pre_ai_judgment_accuracy: pre_improvement_ai_judgment_accuracy,
      post_ai_judgment_accuracy: post_improvement_ai_judgment_accuracy,
      dataset_info: learning_dataset_info
    });

    // OCR精度の改善度を検証（数値）
    // 改善度 = (改善後 - 改善前) / 改善前 * 100
    const expected_ocr_improvement_rate = ((89.7 - 82.5) / 82.5) * 100;
    expect(result.ocr_improvement_rate).toBe(8.849);

    // AI判定精度の改善度を検証（数値）
    // 改善度 = (改善後 - 改善前) / 改善前 * 100
    const expected_ai_improvement_rate = ((86.9 - 78.3) / 78.3) * 100;
    expect(result.ai_judgment_improvement_rate).toBe(11.10);

    // 改善前のOCR精度数値を検証
    expect(result.pre_improvement_metrics.ocr_accuracy).toBe(82.5);

    // 改善前のAI判定精度数値を検証
    expect(result.pre_improvement_metrics.ai_judgment_accuracy).toBe(78.3);

    // 改善後のOCR精度数値を検証
    expect(result.post_improvement_metrics.ocr_accuracy).toBe(89.7);

    // 改善後のAI判定精度数値を検証
    expect(result.post_improvement_metrics.ai_judgment_accuracy).toBe(86.9);

    // グラフの軸ラベルを検証
    expect(result.graph_config.x_axis_label).toBe('改善前・改善後');
    expect(result.graph_config.y_axis_label).toBe('精度（%）');

    // グラフの凡例を検証
    expect(result.graph_config.legend).toEqual(['OCR精度', 'AI判定精度']);

    // グラフのデータ点を検証
    expect(result.graph_data.pre_improvement_points).toEqual({
      ocr_accuracy: 82.5,
      ai_judgment_accuracy: 78.3
    });
    expect(result.graph_data.post_improvement_points).toEqual({
      ocr_accuracy: 89.7,
      ai_judgment_accuracy: 86.9
    });

    // グラフタイトルを検証
    expect(result.graph_config.title).toBe('AI判定モデル再学習による精度改善');

    // 数値とグラフが一致していることを確認
    expect(result.post_improvement_metrics.ocr_accuracy).toBe(result.graph_data.post_improvement_points.ocr_accuracy);
    expect(result.post_improvement_metrics.ai_judgment_accuracy).toBe(result.graph_data.post_improvement_points.ai_judgment_accuracy);

    // 計測結果のエクスポート機能の可用性を検証
    expect(result.export_capability.csv_export_available).toBe(true);
    expect(result.export_capability.excel_export_available).toBe(true);
    expect(result.export_capability.pdf_export_available).toBe(true);

    // エクスポート対象データを検証
    expect(result.export_data).toEqual({
      dataset_id: 'ds_20240315_001',
      data_count: 5420,
      training_period_start: '2024-01-01',
      training_period_end: '2024-03-14',
      pre_ocr_accuracy: 82.5,
      post_ocr_accuracy: 89.7,
      ocr_improvement_rate: 8.849,
      pre_ai_judgment_accuracy: 78.3,
      post_ai_judgment_accuracy: 86.9,
      ai_judgment_improvement_rate: 11.10,
      retraining_completion_datetime: '2024-03-15T14:32:00Z',
      regions_covered: ['東京', '大阪', '愛知', '福岡'],
      construction_types: ['建築', '土木', '設備']
    });

    // 計測の信頼度スコアを検証（0-100の範囲内）
    expect(result.measurement_confidence_score).toBeGreaterThanOrEqual(0);
    expect(result.measurement_confidence_score).toBeLessThanOrEqual(100);
    expect(result.measurement_confidence_score).toBe(94.5);

    // 計測の統計的有意性を検証
    expect(result.statistical_significance.ocr_p_value).toBeLessThan(0.05);
    expect(result.statistical_significance.ai_judgment_p_value).toBeLessThan(0.05);

    // 改善度レベルの段階評価を検証
    expect(result.improvement_level).toBe('高');

    // 再学習完了メッセージの表示確認
    expect(result.completion_message).toBe('再学習が正常に完了しました。');
    expect(result.model_status).toBe('ready_for_deployment');

    // 計測結果の記録タイムスタンプを検証
    expect(result.measurement_timestamp).toBe('2024-03-15T15:02:30Z');

    // 比較対象のベースラインデータを検証
    expect(result.baseline_info.previous_model_version).toBe('v2.1.0');
    expect(result.baseline_info.current_model_version).toBe('v2.2.0');
  });
});
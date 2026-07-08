import { calculatePrecisionMetrics } from '../../src/logic/it-6-2-1-1';

describe('モデル更新後精度測定機能 - 測定対象件数ゼロの場合の精度値計算', () => {
  // SCEN-1139: [edge] モデル更新後精度測定機能 - 測定対象件数がゼロの場合の精度値計算が正確に行われる
  test('測定対象件数がゼロの場合、精度値計算が正確に実行され、適切な初期値が返されること', () => {
    // 入力: 測定対象件数を0件に設定した精度測定タスク
    const measurement_input = {
      model_update_id: 'model_001',
      measurement_period_start: '2024-01-01T00:00:00Z',
      measurement_period_end: '2024-01-31T23:59:59Z',
      target_samples: [],
      ocr_baseline_precision: 85.5,
      ai_judgment_baseline_precision: 82.0,
    };

    // 実行: 精度値計算処理を実行
    const result = calculatePrecisionMetrics(measurement_input);

    // 検証 (1): 計算エラーが発生しないこと
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // 検証 (2): 測定対象件数0の場合、精度値が適切な初期値として返されること
    // - OCR読取精度が 'N/A' または 0 になること
    // - AI判定精度が 'N/A' または 0 になること
    // - 改善度が計算不可を示す値になること
    expect(result.ocr_precision_value).toBe('N/A');
    expect(result.ai_judgment_precision_value).toBe('N/A');
    expect(result.improvement_rate).toBe('N/A');

    // 検証 (3): メタデータが正常に記録されること
    expect(result.measurement_sample_count).toBe(0);
    expect(result.measurement_status).toBe('insufficient_samples');

    // 検証 (4): エラーハンドリングが正常に機能し、例外が記録されないこと
    expect(result.error_occurred).toBe(false);
    expect(result.error_message).toBeUndefined();

    // 検証 (5): タイムスタンプが正確に記録されること
    expect(result.measured_at).toBeDefined();
    expect(typeof result.measured_at).toBe('string');

    // 検証 (6): システムが安定した状態を示す flag が立つこと
    expect(result.system_stable).toBe(true);

    // 検証 (7): 測定対象件数0の場合の baseline との比較は実施されないこと
    expect(result.precision_comparison_performed).toBe(false);
  });
});
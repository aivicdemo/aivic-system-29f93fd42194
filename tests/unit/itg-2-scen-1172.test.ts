import { calculateAccuracyImprovement } from '../../src/logic/it-6-2-2-2';

describe('精度改善度可視化 - 更新内容・実施日時・精度数値・改善度が一元記録され、ダッシュボードに反映される', () => {
  test('SCEN-1172: 精度改善度可視化で更新内容、実施日時、改善前後精度値、改善度が記録・ダッシュボード表示される', () => {
    // 改善前の精度指標
    const baseline_ocr_accuracy = 85.5;
    const baseline_ai_accuracy = 82.3;
    const baseline_assessment_time_minutes = 18;

    // 改善内容：学習データ追加 + モデル再学習
    const improvement_items = ['学習データ追加', 'モデル再学習'];
    const update_details = '過去案件データ200件追加、物価本2025年版反映';
    const update_datetime = new Date('2025-02-15T14:30:00Z');

    // 改善後の精度指標
    const improved_ocr_accuracy = 89.2;
    const improved_ai_accuracy = 86.7;
    const improved_assessment_time_minutes = 15;

    // 計算期待値
    // OCR精度改善率 = (89.2 - 85.5) / 85.5 * 100 = 4.33%
    const expected_ocr_improvement_rate = 4.33;
    // AI判定精度改善率 = (86.7 - 82.3) / 82.3 * 100 = 5.35%
    const expected_ai_improvement_rate = 5.35;
    // 処理時間短縮率 = (18 - 15) / 18 * 100 = 16.67%
    const expected_time_reduction_rate = 16.67;
    // 総合改善スコア = (4.33 + 5.35 + 16.67) / 3 = 8.78
    const expected_overall_improvement_score = 8.78;

    const input_data = {
      improvement_items,
      update_details,
      update_datetime,
      baseline_ocr_accuracy,
      baseline_ai_accuracy,
      baseline_assessment_time_minutes,
      improved_ocr_accuracy,
      improved_ai_accuracy,
      improved_assessment_time_minutes,
    };

    const result = calculateAccuracyImprovement(input_data);

    // 記録内容の検証
    expect(result.recorded_improvement_items).toEqual(improvement_items);
    expect(result.recorded_update_details).toBe(update_details);
    expect(result.recorded_update_datetime).toEqual(update_datetime);

    // 改善前精度数値が記録されている
    expect(result.baseline_metrics.ocr_accuracy).toBe(baseline_ocr_accuracy);
    expect(result.baseline_metrics.ai_accuracy).toBe(baseline_ai_accuracy);
    expect(result.baseline_metrics.assessment_time_minutes).toBe(
      baseline_assessment_time_minutes
    );

    // 改善後精度数値が記録されている
    expect(result.improved_metrics.ocr_accuracy).toBe(improved_ocr_accuracy);
    expect(result.improved_metrics.ai_accuracy).toBe(improved_ai_accuracy);
    expect(result.improved_metrics.assessment_time_minutes).toBe(
      improved_assessment_time_minutes
    );

    // 改善度が計算・記録されている（小数点第2位で丸める）
    expect(Math.round(result.improvement_rates.ocr_improvement_rate * 100) / 100).toBe(
      expected_ocr_improvement_rate
    );
    expect(Math.round(result.improvement_rates.ai_improvement_rate * 100) / 100).toBe(
      expected_ai_improvement_rate
    );
    expect(Math.round(result.improvement_rates.time_reduction_rate * 100) / 100).toBe(
      expected_time_reduction_rate
    );
    expect(Math.round(result.improvement_rates.overall_improvement_score * 100) / 100).toBe(
      expected_overall_improvement_score
    );

    // ダッシュボード用フォーマット検証
    expect(result.dashboard_display.title).toBe('精度改善度可視化');
    expect(result.dashboard_display.update_content).toBe(update_details);
    expect(result.dashboard_display.executed_at).toEqual(update_datetime);
    expect(result.dashboard_display.baseline_ocr_accuracy).toBe(baseline_ocr_accuracy);
    expect(result.dashboard_display.improved_ocr_accuracy).toBe(improved_ocr_accuracy);
    expect(result.dashboard_display.baseline_ai_accuracy).toBe(baseline_ai_accuracy);
    expect(result.dashboard_display.improved_ai_accuracy).toBe(improved_ai_accuracy);
    expect(Math.round(result.dashboard_display.overall_improvement_score * 100) / 100).toBe(
      expected_overall_improvement_score
    );

    // 履歴テーブル用レコード検証
    expect(result.history_record.id).toBeDefined();
    expect(result.history_record.improvement_items).toEqual(improvement_items);
    expect(result.history_record.update_details).toBe(update_details);
    expect(result.history_record.update_datetime).toEqual(update_datetime);
    expect(result.history_record.baseline_ocr_accuracy).toBe(baseline_ocr_accuracy);
    expect(result.history_record.improved_ocr_accuracy).toBe(improved_ocr_accuracy);
    expect(result.history_record.baseline_ai_accuracy).toBe(baseline_ai_accuracy);
    expect(result.history_record.improved_ai_accuracy).toBe(improved_ai_accuracy);
    expect(result.history_record.baseline_assessment_time_minutes).toBe(
      baseline_assessment_time_minutes
    );
    expect(result.history_record.improved_assessment_time_minutes).toBe(
      improved_assessment_time_minutes
    );
    expect(
      Math.round(result.history_record.overall_improvement_score * 100) / 100
    ).toBe(expected_overall_improvement_score);
    expect(result.history_record.recorded_at).toBeDefined();
    expect(result.history_record.recorded_by).toBeDefined();

    // 一元記録が有効な状態
    expect(result.is_unified_record_enabled).toBe(true);
    expect(result.record_status).toBe('recorded');
    expect(result.is_dashboard_reflected).toBe(true);
  });
});
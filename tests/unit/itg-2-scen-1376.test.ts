import { analyzePrecisionDropCauseAndDecideCustomizationScope } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1376: [edge] 精度低下原因特定・カスタマイズ範囲決定機能 - 精度低下率が0%と境界値付近で原因が特定されない場合にカスタマイズ不要と判定される
  test('精度低下率が0%および境界値付近の場合、カスタマイズ不要と判定される', () => {
    // 精度低下率が0%のケース
    const result_zero_drop = analyzePrecisionDropCauseAndDecideCustomizationScope({
      previous_ocr_precision: 92.5,
      current_ocr_precision: 92.5,
      previous_judgment_precision: 88.3,
      current_judgment_precision: 88.3,
      feedback_count: 0,
      learning_data_coverage_rate: 85.0,
      assessment_period_days: 30,
    });

    expect(result_zero_drop.precision_drop_rate).toBe(0.0);
    expect(result_zero_drop.customization_required).toBe(false);
    expect(result_zero_drop.status_message).toBe('カスタマイズ不要');
    expect(result_zero_drop.root_cause).toBeNull();
    expect(result_zero_drop.customization_scope).toEqual([]);

    // 精度低下率が境界値付近（0.1%）のケース
    const result_boundary_drop = analyzePrecisionDropCauseAndDecideCustomizationScope({
      previous_ocr_precision: 92.5,
      current_ocr_precision: 92.409,
      previous_judgment_precision: 88.3,
      current_judgment_precision: 88.211,
      feedback_count: 1,
      learning_data_coverage_rate: 84.9,
      assessment_period_days: 30,
    });

    expect(result_boundary_drop.precision_drop_rate).toBeCloseTo(0.1, 1);
    expect(result_boundary_drop.customization_required).toBe(false);
    expect(result_boundary_drop.status_message).toBe('カスタマイズ不要');
    expect(result_boundary_drop.root_cause).toBeNull();
    expect(result_boundary_drop.customization_scope).toEqual([]);

    // 精度低下率が閾値を超える（5%以上）のケース
    const result_threshold_exceeded = analyzePrecisionDropCauseAndDecideCustomizationScope({
      previous_ocr_precision: 92.5,
      current_ocr_precision: 87.875,
      previous_judgment_precision: 88.3,
      current_judgment_precision: 83.885,
      feedback_count: 15,
      learning_data_coverage_rate: 78.0,
      assessment_period_days: 30,
    });

    expect(result_threshold_exceeded.precision_drop_rate).toBe(5.0);
    expect(result_threshold_exceeded.customization_required).toBe(true);
    expect(result_threshold_exceeded.status_message).toBe('カスタマイズ必要');
    expect(result_threshold_exceeded.root_cause).not.toBeNull();
    expect(result_threshold_exceeded.customization_scope.length).toBeGreaterThan(0);
    expect(result_threshold_exceeded.customization_scope).toContain('学習データ拡張');

    // 精度低下率が2.5%（中程度）のケース - カスタマイズ不要と判定
    const result_moderate_drop = analyzePrecisionDropCauseAndDecideCustomizationScope({
      previous_ocr_precision: 92.5,
      current_ocr_precision: 90.187,
      previous_judgment_precision: 88.3,
      current_judgment_precision: 86.091,
      feedback_count: 8,
      learning_data_coverage_rate: 82.5,
      assessment_period_days: 30,
    });

    expect(result_moderate_drop.precision_drop_rate).toBe(2.5);
    expect(result_moderate_drop.customization_required).toBe(false);
    expect(result_moderate_drop.status_message).toBe('カスタマイズ不要');
    expect(result_moderate_drop.root_cause).toBeNull();
    expect(result_moderate_drop.customization_scope).toEqual([]);

    // OCR精度は低下するが判定精度は低下しないケース
    const result_ocr_only_drop = analyzePrecisionDropCauseAndDecideCustomizationScope({
      previous_ocr_precision: 92.5,
      current_ocr_precision: 88.0,
      previous_judgment_precision: 88.3,
      current_judgment_precision: 88.3,
      feedback_count: 5,
      learning_data_coverage_rate: 84.0,
      assessment_period_days: 30,
    });

    expect(result_ocr_only_drop.precision_drop_rate).toBeCloseTo(4.86, 2);
    expect(result_ocr_only_drop.customization_required).toBe(false);
    expect(result_ocr_only_drop.status_message).toBe('カスタマイズ不要');

    // フィードバック件数が0かつ精度低下がない場合
    const result_no_feedback_no_drop = analyzePrecisionDropCauseAndDecideCustomizationScope({
      previous_ocr_precision: 92.5,
      current_ocr_precision: 92.5,
      previous_judgment_precision: 88.3,
      current_judgment_precision: 88.3,
      feedback_count: 0,
      learning_data_coverage_rate: 90.0,
      assessment_period_days: 30,
    });

    expect(result_no_feedback_no_drop.precision_drop_rate).toBe(0.0);
    expect(result_no_feedback_no_drop.customization_required).toBe(false);
    expect(result_no_feedback_no_drop.status_message).toBe('カスタマイズ不要');
    expect(result_no_feedback_no_drop.root_cause).toBeNull();
  });
});
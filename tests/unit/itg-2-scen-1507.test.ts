import { validateModelAccuracyAfterRetraining } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1507: [edge] AI判定モデル再学習精度検証 - 再学習後のAI判定精度が合格基準の境界値ちょうどで合格判定される
  test('再学習後のAI判定精度が合格基準の境界値ちょうどの場合、正常に合格判定され精度値がログに記録される', () => {
    const baseline_accuracy = 92.5;
    const retrained_accuracy_boundary = 95.0;
    const passing_threshold = 95.0;
    const log_records = [];

    const result_boundary = validateModelAccuracyAfterRetraining({
      baseline_accuracy,
      retrained_accuracy: retrained_accuracy_boundary,
      passing_threshold,
      log_records,
    });

    expect(result_boundary.is_passed).toBe(true);
    expect(result_boundary.accuracy_value).toBe(95.0);
    expect(result_boundary.verdict).toBe('合格');
    expect(result_boundary.improvement_rate).toBe(2.5);
    expect(log_records.length).toBe(1);
    expect(log_records[0]).toMatch(/精度値: 95\.0%/);
  });

  test('再学習後のAI判定精度が合格基準の境界値より0.1%低い場合、不合格判定される', () => {
    const baseline_accuracy = 92.5;
    const retrained_accuracy_below_boundary = 94.9;
    const passing_threshold = 95.0;
    const log_records = [];

    const result_below = validateModelAccuracyAfterRetraining({
      baseline_accuracy,
      retrained_accuracy: retrained_accuracy_below_boundary,
      passing_threshold,
      log_records,
    });

    expect(result_below.is_passed).toBe(false);
    expect(result_below.accuracy_value).toBe(94.9);
    expect(result_below.verdict).toBe('不合格');
    expect(result_below.improvement_rate).toBe(2.4);
    expect(log_records.length).toBe(1);
    expect(log_records[0]).toMatch(/精度値: 94\.9%/);
  });

  test('再学習後のAI判定精度が合格基準の境界値より0.1%高い場合、合格判定される', () => {
    const baseline_accuracy = 92.5;
    const retrained_accuracy_above_boundary = 95.1;
    const passing_threshold = 95.0;
    const log_records = [];

    const result_above = validateModelAccuracyAfterRetraining({
      baseline_accuracy,
      retrained_accuracy: retrained_accuracy_above_boundary,
      passing_threshold,
      log_records,
    });

    expect(result_above.is_passed).toBe(true);
    expect(result_above.accuracy_value).toBe(95.1);
    expect(result_above.verdict).toBe('合格');
    expect(result_above.improvement_rate).toBe(2.6);
    expect(log_records.length).toBe(1);
    expect(log_records[0]).toMatch(/精度値: 95\.1%/);
  });

  test('合格基準に達しない場合、ログに診断情報が記録される', () => {
    const baseline_accuracy = 92.5;
    const retrained_accuracy_low = 90.0;
    const passing_threshold = 95.0;
    const log_records = [];

    const result_low = validateModelAccuracyAfterRetraining({
      baseline_accuracy,
      retrained_accuracy: retrained_accuracy_low,
      passing_threshold,
      log_records,
    });

    expect(result_low.is_passed).toBe(false);
    expect(result_low.verdict).toBe('不合格');
    expect(log_records.length).toBeGreaterThan(0);
    expect(log_records[0]).toMatch(/診断|原因|改善/);
  });

  test('baselineより精度が低下した場合、低下フラグが立てられる', () => {
    const baseline_accuracy = 92.5;
    const retrained_accuracy_degraded = 91.0;
    const passing_threshold = 95.0;
    const log_records = [];

    const result_degraded = validateModelAccuracyAfterRetraining({
      baseline_accuracy,
      retrained_accuracy: retrained_accuracy_degraded,
      passing_threshold,
      log_records,
    });

    expect(result_degraded.is_degraded).toBe(true);
    expect(result_degraded.improvement_rate).toBe(-1.5);
  });

  test('入力精度値が範囲外の場合、エラーが発生する', () => {
    const baseline_accuracy = 92.5;
    const retrained_accuracy_invalid = 150.0;
    const passing_threshold = 95.0;
    const log_records = [];

    expect(() => {
      validateModelAccuracyAfterRetraining({
        baseline_accuracy,
        retrained_accuracy: retrained_accuracy_invalid,
        passing_threshold,
        log_records,
      });
    }).toThrow(/精度範囲/);
  });

  test('passing_thresholdが不正な値の場合、エラーが発生する', () => {
    const baseline_accuracy = 92.5;
    const retrained_accuracy = 95.0;
    const passing_threshold_invalid = -5.0;
    const log_records = [];

    expect(() => {
      validateModelAccuracyAfterRetraining({
        baseline_accuracy,
        retrained_accuracy,
        passing_threshold: passing_threshold_invalid,
        log_records,
      });
    }).toThrow(/閾値/);
  });
});
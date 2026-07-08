import { aggregateAssessmentAccuracyByAssessor } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1067: [edge] 査定員別判定精度・乖離パターン分析 - 判定精度が0%または100%の境界値で正しく処理される
  test('判定精度0%および100%の境界値で正しく処理・保存・表示される', () => {
    // 入力データ: 判定精度0%の査定員レコード
    const assessorRecordsWithZeroAccuracy = [
      {
        assessor_id: 'ASSESSOR_001',
        assessment_count: 10,
        correct_count: 0,
        deviation_rate_sum: 100.0,
        deviation_pattern_high: 5,
        deviation_pattern_normal: 0,
        deviation_pattern_low: 5,
      },
    ];

    const resultZeroAccuracy = aggregateAssessmentAccuracyByAssessor(assessorRecordsWithZeroAccuracy);

    // 期待結果: 判定精度0%が正しく計算される
    expect(resultZeroAccuracy).toEqual({
      assessor_id: 'ASSESSOR_001',
      judgment_accuracy_rate: 0,
      average_deviation_rate: 10.0,
      deviation_pattern_distribution: {
        high_ratio: 50,
        normal_ratio: 0,
        low_ratio: 50,
      },
      quality_flag: 'low_accuracy_warning',
      ui_display_valid: true,
      db_save_status: 'success',
    });

    // 入力データ: 判定精度100%の査定員レコード
    const assessorRecordsWithFullAccuracy = [
      {
        assessor_id: 'ASSESSOR_002',
        assessment_count: 20,
        correct_count: 20,
        deviation_rate_sum: 20.0,
        deviation_pattern_high: 0,
        deviation_pattern_normal: 20,
        deviation_pattern_low: 0,
      },
    ];

    const resultFullAccuracy = aggregateAssessmentAccuracyByAssessor(assessorRecordsWithFullAccuracy);

    // 期待結果: 判定精度100%が正しく計算される
    expect(resultFullAccuracy).toEqual({
      assessor_id: 'ASSESSOR_002',
      judgment_accuracy_rate: 100,
      average_deviation_rate: 1.0,
      deviation_pattern_distribution: {
        high_ratio: 0,
        normal_ratio: 100,
        low_ratio: 0,
      },
      quality_flag: 'high_accuracy',
      ui_display_valid: true,
      db_save_status: 'success',
    });

    // 境界値でのUI表示検証: エラーメッセージが不適切に表示されていないことを確認
    expect(resultZeroAccuracy.ui_display_valid).toBe(true);
    expect(resultFullAccuracy.ui_display_valid).toBe(true);

    // 境界値でのDB保存検証: 値が正確に記録されることを確認
    expect(resultZeroAccuracy.db_save_status).toBe('success');
    expect(resultFullAccuracy.db_save_status).toBe('success');

    // 乖離パターン分析の結果が正しく導出されることを確認
    // 判定精度0%の場合: 高乖離と低乖離が50%ずつ、正常乖離0%
    expect(resultZeroAccuracy.deviation_pattern_distribution.high_ratio).toBe(50);
    expect(resultZeroAccuracy.deviation_pattern_distribution.normal_ratio).toBe(0);
    expect(resultZeroAccuracy.deviation_pattern_distribution.low_ratio).toBe(50);

    // 判定精度100%の場合: 正常乖離が100%
    expect(resultFullAccuracy.deviation_pattern_distribution.high_ratio).toBe(0);
    expect(resultFullAccuracy.deviation_pattern_distribution.normal_ratio).toBe(100);
    expect(resultFullAccuracy.deviation_pattern_distribution.low_ratio).toBe(0);

    // 品質フラグが適切に設定されることを確認
    expect(resultZeroAccuracy.quality_flag).toBe('low_accuracy_warning');
    expect(resultFullAccuracy.quality_flag).toBe('high_accuracy');

    // 複数の査定員を一括集計した場合の処理を確認
    const multipleAssessors = [
      ...assessorRecordsWithZeroAccuracy,
      ...assessorRecordsWithFullAccuracy,
    ];

    const resultMultiple = aggregateAssessmentAccuracyByAssessor(multipleAssessors);

    expect(Array.isArray(resultMultiple)).toBe(true);
    expect(resultMultiple).toHaveLength(2);
    expect(resultMultiple[0].judgment_accuracy_rate).toBe(0);
    expect(resultMultiple[1].judgment_accuracy_rate).toBe(100);

    // 計算ロジックのエラーハンドリング検証: 不正な入力を渡すとエラーが発生
    expect(() => aggregateAssessmentAccuracyByAssessor(null as any)).toThrow(/入力データ/);
    expect(() => aggregateAssessmentAccuracyByAssessor(undefined as any)).toThrow(/入力データ/);
    expect(() =>
      aggregateAssessmentAccuracyByAssessor([
        { assessment_count: -5, correct_count: 0 },
      ] as any)
    ).toThrow(/正の整数/);
    expect(() =>
      aggregateAssessmentAccuracyByAssessor([
        { assessment_count: 10, correct_count: 15 },
      ] as any)
    ).toThrow(/correct_count/);

    // 平均乖離率の計算検証: 判定精度0%の場合
    // deviation_rate_sum = 100.0, assessment_count = 10
    // average_deviation_rate = 100.0 / 10 = 10.0
    expect(resultZeroAccuracy.average_deviation_rate).toBe(10.0);

    // 平均乖離率の計算検証: 判定精度100%の場合
    // deviation_rate_sum = 20.0, assessment_count = 20
    // average_deviation_rate = 20.0 / 20 = 1.0
    expect(resultFullAccuracy.average_deviation_rate).toBe(1.0);

    // 乖離パターン分布の計算検証: 判定精度0%の場合
    // 高乖離: 5件, 正常乖離: 0件, 低乖離: 5件, 合計: 10件
    // 高乖離率: 5/10*100 = 50%, 正常乖離率: 0/10*100 = 0%, 低乖離率: 5/10*100 = 50%
    const zeroAccuracyTotal =
      resultZeroAccuracy.deviation_pattern_distribution.high_ratio +
      resultZeroAccuracy.deviation_pattern_distribution.normal_ratio +
      resultZeroAccuracy.deviation_pattern_distribution.low_ratio;
    expect(zeroAccuracyTotal).toBe(100);

    // 乖離パターン分布の計算検証: 判定精度100%の場合
    // 高乖離: 0件, 正常乖離: 20件, 低乖離: 0件, 合計: 20件
    // 高乖離率: 0/20*100 = 0%, 正常乖離率: 20/20*100 = 100%, 低乖離率: 0/20*100 = 0%
    const fullAccuracyTotal =
      resultFullAccuracy.deviation_pattern_distribution.high_ratio +
      resultFullAccuracy.deviation_pattern_distribution.normal_ratio +
      resultFullAccuracy.deviation_pattern_distribution.low_ratio;
    expect(fullAccuracyTotal).toBe(100);

    // 空の配列を入力した場合の処理
    const emptyResult = aggregateAssessmentAccuracyByAssessor([]);
    expect(Array.isArray(emptyResult)).toBe(true);
    expect(emptyResult).toHaveLength(0);
  });
});
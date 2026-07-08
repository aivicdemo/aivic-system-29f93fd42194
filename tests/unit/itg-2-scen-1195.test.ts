import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregatePrecisionMetrics } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標自動集計', () => {
  test('SCEN-1195: 運用指標データが不足している場合にエラーが返される', () => {
    // Arrange: 必須項目が不足した運用指標データ
    const insufficientMetricsData = {
      assessor_id: 'ASS001',
      construction_type: 'RC',
      // amount_band が欠落（必須フィールド）
      divergence_rate: 5.2,
      assessment_count: 25,
      average_processing_time_minutes: 18,
      assessment_date: '2024-01-15',
    };

    // Act & Assert: 必須フィールド不足でエラーを発生させる
    expect(() => aggregatePrecisionMetrics(insufficientMetricsData as any)).toThrow(/金額帯/);
  });

  test('SCEN-1195: 精度指標が0以上100以下の範囲外の場合にエラーが返される', () => {
    // Arrange: 精度指標が範囲外のデータ
    const out_of_range_metrics = {
      assessor_id: 'ASS002',
      construction_type: 'STEEL',
      amount_band: 'HIGH',
      divergence_rate: 150, // 100を超える不正値
      assessment_count: 30,
      average_processing_time_minutes: 20,
      assessment_date: '2024-01-16',
    };

    // Act & Assert: 範囲外の精度指標でエラーを発生させる
    expect(() => aggregatePrecisionMetrics(out_of_range_metrics as any)).toThrow(/乖離率/);
  });

  test('SCEN-1195: 全必須フィールドが揃っている場合に集計が成功する', () => {
    // Arrange: 完全な運用指標データ
    const completeMetricsData = {
      assessor_id: 'ASS003',
      construction_type: 'BUILDING',
      amount_band: 'MEDIUM',
      divergence_rate: 3.8,
      assessment_count: 42,
      average_processing_time_minutes: 16,
      accuracy_score: 94.5,
      consistency_score: 91.2,
      assessment_date: '2024-01-17',
    };

    // Act: 集計処理を実行
    const result = aggregatePrecisionMetrics(completeMetricsData);

    // Assert: 結果が正常に返される
    expect(result).toEqual({
      assessor_id: 'ASS003',
      construction_type: 'BUILDING',
      amount_band: 'MEDIUM',
      divergence_rate: 3.8,
      assessment_count: 42,
      average_processing_time_minutes: 16,
      accuracy_score: 94.5,
      consistency_score: 91.2,
      assessment_date: '2024-01-17',
      aggregation_status: 'success',
      aggregation_timestamp: expect.any(String),
    });
  });

  test('SCEN-1195: 査定件数が0の場合にエラーが返される', () => {
    // Arrange: 査定件数が0のデータ
    const zero_assessment_count = {
      assessor_id: 'ASS004',
      construction_type: 'RENOVATION',
      amount_band: 'LOW',
      divergence_rate: 2.1,
      assessment_count: 0, // 0件は無効
      average_processing_time_minutes: 15,
      assessment_date: '2024-01-18',
    };

    // Act & Assert: 査定件数0でエラーを発生させる
    expect(() => aggregatePrecisionMetrics(zero_assessment_count as any)).toThrow(/件数/);
  });

  test('SCEN-1195: 処理時間が負数の場合にエラーが返される', () => {
    // Arrange: 処理時間が負数のデータ
    const negative_processing_time = {
      assessor_id: 'ASS005',
      construction_type: 'INFRASTRUCTURE',
      amount_band: 'HIGH',
      divergence_rate: 4.5,
      assessment_count: 38,
      average_processing_time_minutes: -5, // 負数は無効
      assessment_date: '2024-01-19',
    };

    // Act & Assert: 負の処理時間でエラーを発生させる
    expect(() => aggregatePrecisionMetrics(negative_processing_time as any)).toThrow(/処理時間/);
  });

  test('SCEN-1195: assessment_date が無効な日付形式の場合にエラーが返される', () => {
    // Arrange: 無効な日付形式
    const invalid_date_format = {
      assessor_id: 'ASS006',
      construction_type: 'BUILDING',
      amount_band: 'MEDIUM',
      divergence_rate: 3.2,
      assessment_count: 50,
      average_processing_time_minutes: 17,
      assessment_date: '2024/01/20', // 不正な形式（YYYY-MM-DD が必須）
    };

    // Act & Assert: 無効な日付形式でエラーを発生させる
    expect(() => aggregatePrecisionMetrics(invalid_date_format as any)).toThrow(/日付/);
  });

  test('SCEN-1195: 複数の必須フィールドが欠落している場合、最初に検出されたフィールドに関するエラーが返される', () => {
    // Arrange: 複数の必須フィールドが欠落
    const multiple_missing_fields = {
      // assessor_id 欠落
      // construction_type 欠落
      amount_band: 'LOW',
      divergence_rate: 2.5,
      // assessment_count 欠落
    };

    // Act & Assert: 最初に検出された欠落フィールドに関するエラーを発生させる
    expect(() => aggregatePrecisionMetrics(multiple_missing_fields as any)).toThrow(
      /査定担当者ID|工事種別|件数/
    );
  });

  test('SCEN-1195: 精度指標が null の場合にエラーが返される', () => {
    // Arrange: 精度指標が null
    const null_precision_metric = {
      assessor_id: 'ASS007',
      construction_type: 'RESIDENTIAL',
      amount_band: 'MEDIUM',
      divergence_rate: null, // null は無効
      assessment_count: 35,
      average_processing_time_minutes: 19,
      assessment_date: '2024-01-21',
    };

    // Act & Assert: null 値の精度指標でエラーを発生させる
    expect(() => aggregatePrecisionMetrics(null_precision_metric as any)).toThrow(/乖離率/);
  });

  test('SCEN-1195: 精度指標が undefined の場合にエラーが返される', () => {
    // Arrange: 精度指標が undefined
    const undefined_precision_metric = {
      assessor_id: 'ASS008',
      construction_type: 'COMMERCIAL',
      amount_band: 'HIGH',
      divergence_rate: undefined, // undefined は無効
      assessment_count: 28,
      average_processing_time_minutes: 21,
      assessment_date: '2024-01-22',
    };

    // Act & Assert: undefined 値の精度指標でエラーを発生させる
    expect(() => aggregatePrecisionMetrics(undefined_precision_metric as any)).toThrow(/乖離率/);
  });

  test('SCEN-1195: 有効な複数件のメトリクスデータを同時に処理できる', () => {
    // Arrange: 複数の有効なメトリクスデータセット
    const batch_metrics_data = [
      {
        assessor_id: 'ASS009',
        construction_type: 'BUILDING',
        amount_band: 'LOW',
        divergence_rate: 2.3,
        assessment_count: 45,
        average_processing_time_minutes: 14,
        accuracy_score: 96.8,
        assessment_date: '2024-01-23',
      },
      {
        assessor_id: 'ASS010',
        construction_type: 'INFRASTRUCTURE',
        amount_band: 'HIGH',
        divergence_rate: 6.1,
        assessment_count: 22,
        average_processing_time_minutes: 25,
        accuracy_score: 89.3,
        assessment_date: '2024-01-24',
      },
    ];

    // Act: 複数件のメトリクスを集計
    const results = batch_metrics_data.map((metrics) => aggregatePrecisionMetrics(metrics));

    // Assert: 複数件の結果が正常に返される
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      assessor_id: 'ASS009',
      construction_type: 'BUILDING',
      amount_band: 'LOW',
      divergence_rate: 2.3,
      assessment_count: 45,
      average_processing_time_minutes: 14,
      accuracy_score: 96.8,
      assessment_date: '2024-01-23',
      aggregation_status: 'success',
      aggregation_timestamp: expect.any(String),
    });
    expect(results[1]).toEqual({
      assessor_id: 'ASS010',
      construction_type: 'INFRASTRUCTURE',
      amount_band: 'HIGH',
      divergence_rate: 6.1,
      assessment_count: 22,
      average_processing_time_minutes: 25,
      accuracy_score: 89.3,
      assessment_date: '2024-01-24',
      aggregation_status: 'success',
      aggregation_timestamp: expect.any(String),
    });
  });
});
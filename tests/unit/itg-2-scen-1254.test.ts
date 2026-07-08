import { collectOperationalMetrics, generateAlertOnThresholdExceeded } from '../../src/logic/it-6-2-1-1';

describe('運用指標の自動収集と閾値超過時のアラート生成', () => {
  // SCEN-1254
  test('日次・週次・月次の指定時刻に運用指標が自動収集され、閾値超過時にアラートが生成される', () => {
    // ========== Setup: テスト用の固定時刻 ==========
    const daily_9am = new Date('2024-06-15T09:00:00Z');
    const weekly_monday_9am = new Date('2024-06-17T09:00:00Z'); // 月曜
    const monthly_1st_9am = new Date('2024-07-01T09:00:00Z');

    // ========== 日次スケジュール テスト ==========
    const daily_metrics = collectOperationalMetrics({
      schedule_type: 'daily',
      execution_time: daily_9am,
      collection_period_days: 1,
      metrics_to_collect: [
        'ocr_read_accuracy',
        'ai_judgment_accuracy',
        'error_rate',
        'processing_time_seconds',
      ],
    });

    // 期待値: 日次24時間のメトリクス集計
    expect(daily_metrics).toEqual({
      schedule_type: 'daily',
      execution_time: daily_9am,
      collection_period_days: 1,
      metrics: {
        ocr_read_accuracy: 92.5,
        ai_judgment_accuracy: 88.3,
        error_rate: 6.2,
        processing_time_seconds: 35,
      },
      data_points_collected: 1440, // 24時間 × 60分
      timestamp_recorded: daily_9am,
    });

    // 日次のアラート判定
    const daily_alert = generateAlertOnThresholdExceeded({
      metrics: daily_metrics.metrics,
      thresholds: {
        ocr_read_accuracy_min: 90.0,
        ai_judgment_accuracy_min: 85.0,
        error_rate_max: 5.0,
        processing_time_seconds_max: 30,
      },
      alert_level: 'high',
    });

    // 期待値: 複数の閾値超過を検出
    expect(daily_alert).toEqual({
      alert_id: expect.any(String),
      schedule_type: 'daily',
      generated_at: daily_9am,
      exceeded_thresholds: [
        {
          metric_name: 'error_rate',
          current_value: 6.2,
          threshold_value: 5.0,
          exceeds_by_percentage: 24.0,
          status: 'exceeded',
        },
        {
          metric_name: 'processing_time_seconds',
          current_value: 35,
          threshold_value: 30,
          exceeds_by_percentage: 16.67,
          status: 'exceeded',
        },
      ],
      all_metrics_within_threshold: false,
      alert_content: {
        message:
          'エラー率が5.0%を超過（現在6.2%、超過度24.0%）、処理時間が30秒を超過（現在35秒、超過度16.67%）',
        metric_values: {
          ocr_read_accuracy: 92.5,
          ai_judgment_accuracy: 88.3,
          error_rate: 6.2,
          processing_time_seconds: 35,
        },
        threshold_values: {
          ocr_read_accuracy_min: 90.0,
          ai_judgment_accuracy_min: 85.0,
          error_rate_max: 5.0,
          processing_time_seconds_max: 30,
        },
      },
      timestamp_alert_generated: daily_9am,
    });

    // ========== 週次スケジュール テスト ==========
    const weekly_metrics = collectOperationalMetrics({
      schedule_type: 'weekly',
      execution_time: weekly_monday_9am,
      collection_period_days: 7,
      metrics_to_collect: [
        'ocr_read_accuracy',
        'ai_judgment_accuracy',
        'error_rate',
        'processing_time_seconds',
      ],
    });

    // 期待値: 週7日間のメトリクス集計
    expect(weekly_metrics).toEqual({
      schedule_type: 'weekly',
      execution_time: weekly_monday_9am,
      collection_period_days: 7,
      metrics: {
        ocr_read_accuracy: 91.8,
        ai_judgment_accuracy: 87.2,
        error_rate: 4.5,
        processing_time_seconds: 32,
      },
      data_points_collected: 10080, // 7日 × 24時間 × 60分
      timestamp_recorded: weekly_monday_9am,
    });

    // 週次のアラート判定
    const weekly_alert = generateAlertOnThresholdExceeded({
      metrics: weekly_metrics.metrics,
      thresholds: {
        ocr_read_accuracy_min: 90.0,
        ai_judgment_accuracy_min: 85.0,
        error_rate_max: 5.0,
        processing_time_seconds_max: 30,
      },
      alert_level: 'medium',
    });

    // 期待値: 処理時間が閾値を超過
    expect(weekly_alert).toEqual({
      alert_id: expect.any(String),
      schedule_type: 'weekly',
      generated_at: weekly_monday_9am,
      exceeded_thresholds: [
        {
          metric_name: 'processing_time_seconds',
          current_value: 32,
          threshold_value: 30,
          exceeds_by_percentage: 6.67,
          status: 'exceeded',
        },
      ],
      all_metrics_within_threshold: false,
      alert_content: {
        message: '処理時間が30秒を超過（現在32秒、超過度6.67%）',
        metric_values: {
          ocr_read_accuracy: 91.8,
          ai_judgment_accuracy: 87.2,
          error_rate: 4.5,
          processing_time_seconds: 32,
        },
        threshold_values: {
          ocr_read_accuracy_min: 90.0,
          ai_judgment_accuracy_min: 85.0,
          error_rate_max: 5.0,
          processing_time_seconds_max: 30,
        },
      },
      timestamp_alert_generated: weekly_monday_9am,
    });

    // ========== 月次スケジュール テスト ==========
    const monthly_metrics = collectOperationalMetrics({
      schedule_type: 'monthly',
      execution_time: monthly_1st_9am,
      collection_period_days: 30,
      metrics_to_collect: [
        'ocr_read_accuracy',
        'ai_judgment_accuracy',
        'error_rate',
        'processing_time_seconds',
      ],
    });

    // 期待値: 月30日間のメトリクス集計
    expect(monthly_metrics).toEqual({
      schedule_type: 'monthly',
      execution_time: monthly_1st_9am,
      collection_period_days: 30,
      metrics: {
        ocr_read_accuracy: 92.1,
        ai_judgment_accuracy: 87.9,
        error_rate: 3.8,
        processing_time_seconds: 29,
      },
      data_points_collected: 43200, // 30日 × 24時間 × 60分
      timestamp_recorded: monthly_1st_9am,
    });

    // 月次のアラート判定（全指標が正常範囲）
    const monthly_alert = generateAlertOnThresholdExceeded({
      metrics: monthly_metrics.metrics,
      thresholds: {
        ocr_read_accuracy_min: 90.0,
        ai_judgment_accuracy_min: 85.0,
        error_rate_max: 5.0,
        processing_time_seconds_max: 30,
      },
      alert_level: 'info',
    });

    // 期待値: 全指標が閾値内
    expect(monthly_alert).toEqual({
      alert_id: expect.any(String),
      schedule_type: 'monthly',
      generated_at: monthly_1st_9am,
      exceeded_thresholds: [],
      all_metrics_within_threshold: true,
      alert_content: {
        message: 'すべての運用指標が正常範囲内です。',
        metric_values: {
          ocr_read_accuracy: 92.1,
          ai_judgment_accuracy: 87.9,
          error_rate: 3.8,
          processing_time_seconds: 29,
        },
        threshold_values: {
          ocr_read_accuracy_min: 90.0,
          ai_judgment_accuracy_min: 85.0,
          error_rate_max: 5.0,
          processing_time_seconds_max: 30,
        },
      },
      timestamp_alert_generated: monthly_1st_9am,
    });

    // ========== 統合検証: 複数スケジュール実行の整合性 ==========
    expect(daily_metrics.timestamp_recorded).toEqual(daily_9am);
    expect(weekly_metrics.timestamp_recorded).toEqual(weekly_monday_9am);
    expect(monthly_metrics.timestamp_recorded).toEqual(monthly_1st_9am);

    // アラート ID が一意であることを確認
    const alert_ids = [
      daily_alert.alert_id,
      weekly_alert.alert_id,
      monthly_alert.alert_id,
    ];
    const unique_alert_ids = new Set(alert_ids);
    expect(unique_alert_ids.size).toBe(3);

    // スケジュール型の整合性確認
    expect(daily_alert.schedule_type).toBe('daily');
    expect(weekly_alert.schedule_type).toBe('weekly');
    expect(monthly_alert.schedule_type).toBe('monthly');

    // 日次と週次のエラー率が正常範囲内に改善されていることを確認
    expect(weekly_metrics.metrics.error_rate).toBeLessThan(
      daily_metrics.metrics.error_rate
    );

    // 月次のエラー率が最も低いことを確認
    expect(monthly_metrics.metrics.error_rate).toBeLessThan(
      weekly_metrics.metrics.error_rate
    );

    // アラートメッセージの正確性確認
    expect(daily_alert.alert_content.message).toContain('エラー率');
    expect(daily_alert.alert_content.message).toContain('処理時間');
    expect(weekly_alert.alert_content.message).toContain('処理時間');
    expect(monthly_alert.alert_content.message).toContain('正常範囲内');
  });
});
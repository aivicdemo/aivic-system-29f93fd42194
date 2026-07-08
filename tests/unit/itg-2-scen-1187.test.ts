import { detectLearningDataQualityDegradation } from "../../src/logic/it-1-br-6-2-1";

describe("学習データ品質監視 - 品質指標劣化傾向検出とアラート発火", () => {
  test("SCEN-1187: 学習データ品質指標が劣化傾向を示した場合、精度低下の早期検出アラートが発火し、劣化パターン詳細とタイムスタンプが記録される", () => {
    // 過去30日間の品質指標トレンドデータ
    // 品質指標の劣化パターン: データ完全性が95% → 85% → 75% に低下
    const degradation_trend = [
      {
        date: "2024-12-01T09:00:00Z",
        data_completeness_rate: 95,
        data_accuracy_rate: 92,
        data_timeliness_days: 2,
        duplicate_rate: 2.1,
      },
      {
        date: "2024-12-11T09:00:00Z",
        data_completeness_rate: 85,
        data_accuracy_rate: 88,
        data_timeliness_days: 5,
        duplicate_rate: 3.8,
      },
      {
        date: "2024-12-21T09:00:00Z",
        data_completeness_rate: 75,
        data_accuracy_rate: 82,
        data_timeliness_days: 9,
        duplicate_rate: 5.2,
      },
    ];

    const alert_threshold_completeness = 80;
    const alert_threshold_downtrend_rate = 10;
    const monitoring_window_days = 30;

    const result = detectLearningDataQualityDegradation({
      trend_data: degradation_trend,
      completeness_threshold: alert_threshold_completeness,
      downtrend_threshold_percent: alert_threshold_downtrend_rate,
      window_days: monitoring_window_days,
      current_timestamp: "2024-12-21T10:30:00Z",
    });

    // アラート発火確認
    expect(result.alert_triggered).toBe(true);

    // アラートの詳細情報検証
    expect(result.alert_content).toEqual({
      severity: "high",
      message: "学習データ品質指標が劣化傾向を示しています。精度低下のリスクがあります。",
      degradation_pattern: {
        metric: "data_completeness_rate",
        initial_value: 95,
        final_value: 75,
        downtrend_rate_percent: 20,
      },
      affected_days: 20,
      recommendation: "学習データの品質改善とモデル再学習を推奨します。",
    });

    // タイムスタンプとログ記録の検証
    expect(result.alert_fired_at).toBe("2024-12-21T10:30:00Z");
    expect(result.log_recorded).toBe(true);
    expect(result.log_entry).toEqual({
      timestamp: "2024-12-21T10:30:00Z",
      event_type: "learning_data_quality_alert",
      degradation_metric: "data_completeness_rate",
      degradation_points: 20,
      threshold_value: 80,
      status: "alert_fired",
    });

    // 通知チャネル検証
    expect(result.notification_channels).toContain("email");
    expect(result.notification_channels).toContain("dashboard");

    // 品質指標劣化の詳細分析検証
    expect(result.quality_analysis).toEqual({
      days_analyzed: 20,
      metrics_degraded: ["data_completeness_rate", "data_timeliness_days", "duplicate_rate"],
      metrics_stable: ["data_accuracy_rate"],
      critical_metric: "data_completeness_rate",
      current_status: "degraded",
      early_detection_confidence: 0.92,
    });

    // アラート内容に劣化パターン詳細が含まれているか
    expect(result.alert_content.degradation_pattern).toBeDefined();
    expect(result.alert_content.degradation_pattern.downtrend_rate_percent).toBe(20);
    expect(result.alert_content.degradation_pattern.metric).toBe("data_completeness_rate");

    // ダッシュボード表示用データの検証
    expect(result.dashboard_display_data).toEqual({
      current_completeness: 75,
      threshold_completeness: 80,
      status_indicator: "alert",
      visual_trend_chart: [95, 85, 75],
      is_below_threshold: true,
    });
  });
});
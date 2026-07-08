import { calculateOperationalMetricsAlert } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1257: 運用指標の自動収集と閾値超過時のアラート生成機能 - 指標が閾値と完全に一致する境界値時にアラートが生成される", () => {
    // 初期設定：テスト用の閾値を設定（閾値=100）
    const threshold = 100;
    const metricsValue = 100; // 指標値を閾値と完全に一致させる

    // 自動収集プロセスを実行してアラート生成ロジックを実行
    const alert_result = calculateOperationalMetricsAlert({
      threshold_value: threshold,
      current_metric_value: metricsValue,
      metric_type: "OCR_ACCURACY",
      collection_timestamp: new Date("2024-12-15T09:00:00Z").toISOString(),
    });

    // アラート生成の検証
    expect(alert_result.alert_generated).toBe(true);
    expect(alert_result.alert_status).toBe("ACTIVE");
    expect(alert_result.boundary_condition_matched).toBe(true);
    expect(alert_result.threshold_value).toBe(100);
    expect(alert_result.current_value).toBe(100);
    expect(alert_result.comparison_result).toBe("EQUAL");

    // アラート内容の構造化データ検証
    expect(alert_result.alert_content).toEqual({
      severity_level: "BOUNDARY",
      message_key: "threshold_boundary_match",
      metric_type: "OCR_ACCURACY",
      event_timestamp: new Date("2024-12-15T09:00:00Z").toISOString(),
    });

    // ログ記録の検証
    expect(alert_result.log_entries).toHaveLength(1);
    expect(alert_result.log_entries[0]).toEqual({
      event_type: "THRESHOLD_BOUNDARY",
      description: "Operational metric equals threshold at boundary",
      timestamp: new Date("2024-12-15T09:00:00Z").toISOString(),
      value: 100,
    });

    // 通知送信フラグの検証
    expect(alert_result.notification_triggered).toBe(true);
    expect(alert_result.notification_recipients).toContain("operations_team");
    expect(alert_result.notification_channel).toBe("email");
  });
});
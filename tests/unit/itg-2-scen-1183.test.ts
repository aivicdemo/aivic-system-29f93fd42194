import { describe, test, expect, beforeEach } from "@jest/globals";
import { aggregateOperationalMetrics } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1183
  test("運用指標自動集計 - 全ての運用指標が閾値内に収まった場合、正常判定され監視が継続される", () => {
    // ビジネスルール: 各指標が事前に設定された閾値を超過しない場合、異常フラグを立てず、監視を継続する
    // structured: inputs で複数指標の値と閾値を受け取り、すべて正常ならば判定結果 "NORMAL" を返す

    const operationalMetrics = {
      ocr_accuracy_rate: 87.5, // OCR読取精度 (閾値: 70.0% 以上)
      ai_judgment_accuracy_rate: 82.3, // AI判定精度 (閾値: 75.0% 以上)
      average_processing_time_minutes: 18.5, // 平均処理時間 (閾値: 30分 以下)
      error_rate_percent: 2.1, // エラー率 (閾値: 5.0% 以下)
      system_uptime_percent: 99.8, // システム稼働率 (閾値: 95.0% 以上)
      user_feedback_count: 3, // ユーザーフィードバック件数 (閾値: 10件 以下)
    };

    const thresholds = {
      ocr_accuracy_rate_min: 70.0,
      ai_judgment_accuracy_rate_min: 75.0,
      average_processing_time_max: 30,
      error_rate_max: 5.0,
      system_uptime_percent_min: 95.0,
      user_feedback_count_max: 10,
    };

    const aggregationTimestamp = new Date("2024-01-31T23:59:00Z");
    const collectionStartDate = new Date("2024-01-01T00:00:00Z");
    const collectionEndDate = new Date("2024-01-31T23:59:00Z");

    const result = aggregateOperationalMetrics({
      metrics: operationalMetrics,
      thresholds: thresholds,
      aggregation_timestamp: aggregationTimestamp,
      collection_period_start: collectionStartDate,
      collection_period_end: collectionEndDate,
    });

    // 期待結果: 全指標が閾値内に収まっているため、判定ステータスは "NORMAL"
    expect(result.judgment_status).toBe("NORMAL");

    // 期待結果: 異常フラグなし
    expect(result.anomaly_detected).toBe(false);

    // 期待結果: 監視が継続される
    expect(result.monitoring_continues).toBe(true);

    // 期待結果: すべてのメトリクス判定が合格
    expect(result.metrics_judgment).toEqual({
      ocr_accuracy_rate: {
        value: 87.5,
        threshold: 70.0,
        status: "PASS",
        exceeded: false,
      },
      ai_judgment_accuracy_rate: {
        value: 82.3,
        threshold: 75.0,
        status: "PASS",
        exceeded: false,
      },
      average_processing_time_minutes: {
        value: 18.5,
        threshold: 30,
        status: "PASS",
        exceeded: false,
      },
      error_rate_percent: {
        value: 2.1,
        threshold: 5.0,
        status: "PASS",
        exceeded: false,
      },
      system_uptime_percent: {
        value: 99.8,
        threshold: 95.0,
        status: "PASS",
        exceeded: false,
      },
      user_feedback_count: {
        value: 3,
        threshold: 10,
        status: "PASS",
        exceeded: false,
      },
    });

    // 期待結果: ダッシュボード表示用ステータスは緑色（正常）
    expect(result.dashboard_display_status).toBe("GREEN");

    // 期待結果: アラート通知なし
    expect(result.alert_notification_required).toBe(false);

    // 期待結果: 超過指標なし
    expect(result.exceeded_metrics_count).toBe(0);

    // 期待結果: 集計タイムスタンプが正確に記録される
    expect(result.aggregation_timestamp).toEqual(aggregationTimestamp);

    // 期待結果: 集計期間が正確に記録される
    expect(result.collection_period_start).toEqual(collectionStartDate);
    expect(result.collection_period_end).toEqual(collectionEndDate);

    // 期待結果: 判定根拠がシステムに記録される
    expect(result.judgment_reason).toBe(
      "全ての運用指標が閾値以内。システムは正常に稼働中。"
    );

    // 期待結果: 推奨アクションなし
    expect(result.recommended_actions).toEqual([]);
  });
});
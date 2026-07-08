import { aggregateOperatingMetrics } from "../../src/logic/it-1-br-2-2-2-1";

describe("運用指標自動集計 - 見積書処理数100件トリガー", () => {
  test("SCEN-1185: 見積書処理数が100件に達した時点で運用指標が自動集計され、閾値と比較されてアラートが生成される", () => {
    // === 初期化フェーズ ===
    const initialProcessCount = 0;
    const triggerThreshold = 100;

    // === 99件処理までのシミュレーション ===
    const metricsAt99Items = {
      processedCount: 99,
      averageAssessmentTime: 8.5,
      successRate: 96.5,
      errorRate: 3.5,
      ocrAccuracy: 94.2,
      aiJudgmentAccuracy: 92.8,
      systemUptime: 99.8,
      userFeedbackCount: 12,
    };

    // 99件時点では自動集計が実行されない（トリガーに達していない）
    expect(metricsAt99Items.processedCount).toBe(99);
    expect(metricsAt99Items.processedCount % triggerThreshold).not.toBe(0);

    // === 100件処理時のシミュレーション ===
    const metricsAt100Items = {
      processedCount: 100,
      aggregationTriggered: true,
      aggregationTimestamp: new Date("2024-02-15T09:15:00Z"),
      averageAssessmentTime: 8.3,
      successRate: 96.8,
      errorRate: 3.2,
      ocrAccuracy: 94.5,
      aiJudgmentAccuracy: 93.1,
      systemUptime: 99.85,
      userFeedbackCount: 11,
    };

    // 100件時点で自動集計がトリガーされる
    expect(metricsAt100Items.processedCount).toBe(100);
    expect(metricsAt100Items.processedCount % triggerThreshold).toBe(0);
    expect(metricsAt100Items.aggregationTriggered).toBe(true);

    // === 閾値設定の確認 ===
    const thresholdConfig = {
      ocrAccuracyBaseValue: 90.0,
      ocrAccuracyWarningThreshold: 89.0,
      ocrAccuracyAlarmThreshold: 85.0,
      aiJudgmentAccuracyBaseValue: 90.0,
      aiJudgmentAccuracyWarningThreshold: 88.0,
      aiJudgmentAccuracyAlarmThreshold: 85.0,
      errorRateBaseValue: 5.0,
      errorRateWarningThreshold: 7.0,
      errorRateAlarmThreshold: 10.0,
      systemUptimeBaseValue: 99.0,
      systemUptimeWarningThreshold: 98.5,
      systemUptimeAlarmThreshold: 95.0,
      feedbackVolumeWarningThreshold: 15,
      feedbackVolumeAlarmThreshold: 25,
    };

    // === 集計結果と閾値比較 ===
    const input = {
      processedCount: 100,
      metrics: metricsAt100Items,
      thresholds: thresholdConfig,
    };

    const result = aggregateOperatingMetrics(input);

    // === 期待値の計算 ===
    // OCR精度: 94.5 > 90.0（基準値） かつ > 89.0（警告値） → 正常
    expect(result.aggregationExecuted).toBe(true);
    expect(result.processedItemCount).toBe(100);

    // OCR精度チェック: 94.5 > 89.0 の警告値を上回る → 正常
    expect(result.metrics.ocrAccuracy).toBe(94.5);
    expect(result.ocrAccuracyStatus).toBe("normal");

    // AI判定精度チェック: 93.1 > 88.0 の警告値を上回る → 正常
    expect(result.metrics.aiJudgmentAccuracy).toBe(93.1);
    expect(result.aiJudgmentAccuracyStatus).toBe("normal");

    // エラー率チェック: 3.2 < 5.0（基準値） かつ < 7.0（警告値） → 正常
    expect(result.metrics.errorRate).toBe(3.2);
    expect(result.errorRateStatus).toBe("normal");

    // システムアップタイムチェック: 99.85 > 99.0（基準値） → 正常
    expect(result.metrics.systemUptime).toBe(99.85);
    expect(result.systemUptimeStatus).toBe("normal");

    // ユーザーフィードバック件数チェック: 11 < 15（警告値） < 25（アラーム値） → 正常
    expect(result.metrics.userFeedbackCount).toBe(11);
    expect(result.feedbackVolumeStatus).toBe("normal");

    // === アラート生成の確認 ===
    expect(result.alertsGenerated).toBe(false);
    expect(result.alerts).toEqual([]);
    expect(result.aggregationRecordedInDb).toBe(true);

    // === 200件処理時のシミュレーション（第2サイクル） ===
    const metricsAt200Items = {
      processedCount: 200,
      aggregationTriggered: true,
      aggregationTimestamp: new Date("2024-02-15T10:30:00Z"),
      averageAssessmentTime: 8.4,
      successRate: 96.6,
      errorRate: 3.4,
      ocrAccuracy: 93.8,
      aiJudgmentAccuracy: 92.5,
      systemUptime: 99.7,
      userFeedbackCount: 18,
    };

    const input2 = {
      processedCount: 200,
      metrics: metricsAt200Items,
      thresholds: thresholdConfig,
    };

    const result2 = aggregateOperatingMetrics(input2);

    // 200件処理時も自動集計がトリガーされる
    expect(result2.aggregationExecuted).toBe(true);
    expect(result2.processedItemCount).toBe(200);
    expect(result2.metrics.ocrAccuracy).toBe(93.8);
    expect(result2.metrics.aiJudgmentAccuracy).toBe(92.5);
    expect(result2.metrics.systemUptime).toBe(99.7);
    expect(result2.metrics.userFeedbackCount).toBe(18);

    // ユーザーフィードバック: 18 > 15（警告値） だが < 25（アラーム値） → 警告
    expect(result2.feedbackVolumeStatus).toBe("warning");
    expect(result2.alertsGenerated).toBe(true);
    expect(result2.alerts.length).toBeGreaterThan(0);
    expect(result2.alerts[0]).toHaveProperty("alertType", "feedback_volume_warning");
    expect(result2.alerts[0]).toHaveProperty("severity", "warning");

    // === 300件処理時のシミュレーション（第3サイクル、アラーム条件） ===
    const metricsAt300Items = {
      processedCount: 300,
      aggregationTriggered: true,
      aggregationTimestamp: new Date("2024-02-15T11:45:00Z"),
      averageAssessmentTime: 8.6,
      successRate: 95.2,
      errorRate: 4.8,
      ocrAccuracy: 84.5,
      aiJudgmentAccuracy: 83.9,
      systemUptime: 94.2,
      userFeedbackCount: 32,
    };

    const input3 = {
      processedCount: 300,
      metrics: metricsAt300Items,
      thresholds: thresholdConfig,
    };

    const result3 = aggregateOperatingMetrics(input3);

    // 300件処理時も自動集計がトリガーされる
    expect(result3.aggregationExecuted).toBe(true);
    expect(result3.processedItemCount).toBe(300);

    // OCR精度: 84.5 < 85.0（アラーム値） → アラーム
    expect(result3.metrics.ocrAccuracy).toBe(84.5);
    expect(result3.ocrAccuracyStatus).toBe("alarm");

    // AI判定精度: 83.9 < 85.0（アラーム値） → アラーム
    expect(result3.metrics.aiJudgmentAccuracy).toBe(83.9);
    expect(result3.aiJudgmentAccuracyStatus).toBe("alarm");

    // システムアップタイム: 94.2 < 95.0（アラーム値） → アラーム
    expect(result3.metrics.systemUptime).toBe(94.2);
    expect(result3.systemUptimeStatus).toBe("alarm");

    // ユーザーフィードバック: 32 > 25（アラーム値） → アラーム
    expect(result3.metrics.userFeedbackCount).toBe(32);
    expect(result3.feedbackVolumeStatus).toBe("alarm");

    // 複数のアラートが生成される
    expect(result3.alertsGenerated).toBe(true);
    expect(result3.alerts.length).toBeGreaterThanOrEqual(4);

    // === 定期的トリガーの確認 ===
    // 100, 200, 300 件で自動集計がトリガーされる
    expect(metricsAt100Items.processedCount % triggerThreshold).toBe(0);
    expect(metricsAt200Items.processedCount % triggerThreshold).toBe(0);
    expect(metricsAt300Items.processedCount % triggerThreshold).toBe(0);

    // === DB記録の確認 ===
    expect(result.aggregationRecordedInDb).toBe(true);
    expect(result2.aggregationRecordedInDb).toBe(true);
    expect(result3.aggregationRecordedInDb).toBe(true);
  });
});
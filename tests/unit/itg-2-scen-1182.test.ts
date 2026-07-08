import {
  detectOperationalMetricsAnomaly,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("運用指標自動集計 - 異常検知と通知", () => {
  test("SCEN-1182: 閾値超過時に異常フラグが立ち、原価管理システム運用者に通知される", () => {
    // 事前設定される監視閾値
    const thresholds = {
      ocrErrorRatePercent: 5.0,
      aiJudgmentErrorRatePercent: 7.0,
      avgProcessingTimeSeconds: 300,
      userFeedbackCountDaily: 10,
    };

    // テスト用の収集データ: 複数の指標が閾値を超過
    const collectedMetrics = {
      collectionDatetime: new Date("2024-01-15T14:30:00Z"),
      ocrErrorRatePercent: 8.5, // 閾値 5.0% を超過
      aiJudgmentErrorRatePercent: 6.2, // 閾値 7.0% 以下 (正常)
      avgProcessingTimeSeconds: 420, // 閾値 300秒 を超過
      userFeedbackCountDaily: 12, // 閾値 10件 を超過
      operatorEmailAddress: "operator@example.com",
    };

    // 自動集計処理を実行
    const result = detectOperationalMetricsAnomaly(
      collectedMetrics,
      thresholds
    );

    // 異常フラグが立つことを確認
    expect(result.anomalyDetected).toBe(true);

    // 超過した指標が正しく記録されることを確認
    expect(result.exceededMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metricName: "ocrErrorRatePercent",
          thresholdValue: 5.0,
          actualValue: 8.5,
          exceededDegreePercent: 70.0, // (8.5 - 5.0) / 5.0 * 100 = 70%
        }),
        expect.objectContaining({
          metricName: "avgProcessingTimeSeconds",
          thresholdValue: 300,
          actualValue: 420,
          exceededDegreePercent: 40.0, // (420 - 300) / 300 * 100 = 40%
        }),
        expect.objectContaining({
          metricName: "userFeedbackCountDaily",
          thresholdValue: 10,
          actualValue: 12,
          exceededDegreePercent: 20.0, // (12 - 10) / 10 * 100 = 20%
        }),
      ])
    );

    // 正常な指標は exceededMetrics に含まれない
    expect(result.exceededMetrics).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          metricName: "aiJudgmentErrorRatePercent",
        }),
      ])
    );

    // 通知内容が正しく生成されることを確認
    expect(result.notificationMessage).toContain("異常検知");
    expect(result.notificationMessage).toContain("ocrErrorRatePercent");
    expect(result.notificationMessage).toContain("8.5");
    expect(result.notificationMessage).toContain("avgProcessingTimeSeconds");
    expect(result.notificationMessage).toContain("420");
    expect(result.notificationMessage).toContain("userFeedbackCountDaily");
    expect(result.notificationMessage).toContain("12");

    // 通知受信者が原価管理システム運用者に設定されることを確認
    expect(result.notificationRecipient).toBe("operator@example.com");

    // 通知が送信マーク済みであることを確認
    expect(result.notificationSent).toBe(true);

    // 通知送信タイムスタンプが記録されることを確認
    expect(result.notificationSentDatetime).toBeInstanceOf(Date);
    expect(result.notificationSentDatetime.getTime()).toBeGreaterThanOrEqual(
      collectedMetrics.collectionDatetime.getTime()
    );

    // 異常検知ログが生成されることを確認
    expect(result.anomalyLogId).toBeDefined();
    expect(typeof result.anomalyLogId).toBe("string");
    expect(result.anomalyLogId.length).toBeGreaterThan(0);

    // 超過指標数が正しく集計されることを確認
    expect(result.exceededMetricsCount).toBe(3);

    // 最大超過度が正しく算出されることを確認 (70% が最大)
    expect(result.maxExceededDegreePercent).toBe(70.0);
  });

  test("SCEN-1182: 全指標が閾値内の場合、異常フラグが立たない", () => {
    const thresholds = {
      ocrErrorRatePercent: 5.0,
      aiJudgmentErrorRatePercent: 7.0,
      avgProcessingTimeSeconds: 300,
      userFeedbackCountDaily: 10,
    };

    // すべての収集データが閾値内
    const collectedMetrics = {
      collectionDatetime: new Date("2024-01-15T15:00:00Z"),
      ocrErrorRatePercent: 3.2,
      aiJudgmentErrorRatePercent: 5.1,
      avgProcessingTimeSeconds: 250,
      userFeedbackCountDaily: 8,
      operatorEmailAddress: "operator@example.com",
    };

    const result = detectOperationalMetricsAnomaly(
      collectedMetrics,
      thresholds
    );

    // 異常フラグが立たない
    expect(result.anomalyDetected).toBe(false);

    // 超過指標が空配列
    expect(result.exceededMetrics).toEqual([]);

    // 超過指標数が 0
    expect(result.exceededMetricsCount).toBe(0);

    // 通知は送信されない
    expect(result.notificationSent).toBe(false);
  });

  test("SCEN-1182: 閾値が正確に等しい場合、超過と判定されない", () => {
    const thresholds = {
      ocrErrorRatePercent: 5.0,
      aiJudgmentErrorRatePercent: 7.0,
      avgProcessingTimeSeconds: 300,
      userFeedbackCountDaily: 10,
    };

    // 収集データが閾値と完全に等しい
    const collectedMetrics = {
      collectionDatetime: new Date("2024-01-15T15:30:00Z"),
      ocrErrorRatePercent: 5.0,
      aiJudgmentErrorRatePercent: 7.0,
      avgProcessingTimeSeconds: 300,
      userFeedbackCountDaily: 10,
      operatorEmailAddress: "operator@example.com",
    };

    const result = detectOperationalMetricsAnomaly(
      collectedMetrics,
      thresholds
    );

    // 等しい場合は超過と見なさない
    expect(result.anomalyDetected).toBe(false);
    expect(result.exceededMetrics).toEqual([]);
    expect(result.exceededMetricsCount).toBe(0);
  });

  test("SCEN-1182: 運用者メールアドレスが未設定の場合、エラーを投げる", () => {
    const thresholds = {
      ocrErrorRatePercent: 5.0,
      aiJudgmentErrorRatePercent: 7.0,
      avgProcessingTimeSeconds: 300,
      userFeedbackCountDaily: 10,
    };

    const collectedMetrics = {
      collectionDatetime: new Date("2024-01-15T16:00:00Z"),
      ocrErrorRatePercent: 8.5,
      aiJudgmentErrorRatePercent: 6.2,
      avgProcessingTimeSeconds: 420,
      userFeedbackCountDaily: 12,
      operatorEmailAddress: "", // 未設定
    };

    expect(() => {
      detectOperationalMetricsAnomaly(collectedMetrics, thresholds);
    }).toThrow(/運用者メールアドレス/);
  });

  test("SCEN-1182: 運用者メールアドレスが不正な形式の場合、エラーを投げる", () => {
    const thresholds = {
      ocrErrorRatePercent: 5.0,
      aiJudgmentErrorRatePercent: 7.0,
      avgProcessingTimeSeconds: 300,
      userFeedbackCountDaily: 10,
    };

    const collectedMetrics = {
      collectionDatetime: new Date("2024-01-15T16:30:00Z"),
      ocrErrorRatePercent: 8.5,
      aiJudgmentErrorRatePercent: 6.2,
      avgProcessingTimeSeconds: 420,
      userFeedbackCountDaily: 12,
      operatorEmailAddress: "invalid-email-format", // 不正な形式
    };

    expect(() => {
      detectOperationalMetricsAnomaly(collectedMetrics, thresholds);
    }).toThrow(/メールアドレス/);
  });

  test("SCEN-1182: 通知メッセージに異常内容が正しく含まれる", () => {
    const thresholds = {
      ocrErrorRatePercent: 5.0,
      aiJudgmentErrorRatePercent: 7.0,
      avgProcessingTimeSeconds: 300,
      userFeedbackCountDaily: 10,
    };

    const collectedMetrics = {
      collectionDatetime: new Date("2024-01-15T17:00:00Z"),
      ocrErrorRatePercent: 9.0,
      aiJudgmentErrorRatePercent: 6.2,
      avgProcessingTimeSeconds: 500,
      userFeedbackCountDaily: 15,
      operatorEmailAddress: "ops@company.com",
    };

    const result = detectOperationalMetricsAnomaly(
      collectedMetrics,
      thresholds
    );

    // 通知メッセージに発生時刻が含まれる
    expect(result.notificationMessage).toContain("2024-01-15");
    expect(result.notificationMessage).toContain("17:00");

    // 通知メッセージに各超過指標の詳細が含まれる
    expect(result.notificationMessage).toContain("9.0");
    expect(result.notificationMessage).toContain("5.0");
    expect(result.notificationMessage).toContain("500");
    expect(result.notificationMessage).toContain("15");

    // 通知メッセージが適切な長さを持つ (最小限の内容)
    expect(result.notificationMessage.length).toBeGreaterThan(50);
  });

  test("SCEN-1182: 複数の指標超過時、最大超過度が正しく計算される", () => {
    const thresholds = {
      ocrErrorRatePercent: 10.0,
      aiJudgmentErrorRatePercent: 8.0,
      avgProcessingTimeSeconds: 200,
      userFeedbackCountDaily: 5,
    };

    const collectedMetrics = {
      collectionDatetime: new Date("2024-01-15T17:30:00Z"),
      ocrErrorRatePercent: 20.0, // 超過度: (20 - 10) / 10 * 100 = 100%
      aiJudgmentErrorRatePercent: 16.0, // 超過度: (16 - 8) / 8 * 100 = 100%
      avgProcessingTimeSeconds: 250, // 超過度: (250 - 200) / 200 * 100 = 25%
      userFeedbackCountDaily: 6, // 超過度: (6 - 5) / 5 * 100 = 20%
      operatorEmailAddress: "admin@ops.com",
    };

    const result = detectOperationalMetricsAnomaly(
      collectedMetrics,
      thresholds
    );

    // 最大超過度が 100% であることを確認
    expect(result.maxExceededDegreePercent).toBe(100.0);

    // 超過指標数が 4 (すべて超過)
    expect(result.exceededMetricsCount).toBe(4);
  });
});
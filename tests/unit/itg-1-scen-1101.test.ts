import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesReportAggregation,
  AggregationValidationResult,
  AnomalyNotification,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  let notificationLog: AnomalyNotification[] = [];

  beforeEach(() => {
    notificationLog = [];
  });

  // SCEN-1101: [error] 営業報告書集計検証 - 異常値（成約数がアポ数を上回る等）が検出された場合、即座に通知されること
  test("should detect and notify immediately when agreements exceed appointments", () => {
    // 準備: テストデータを作成（成約数がアポ数を上回る）
    const input = {
      customerId: "CUST-001",
      appointmentCount: 5,
      agreementCount: 8,
      responseCount: 3,
      timestamp: new Date("2024-01-15T09:30:00Z"),
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    // 実行: 異常値検出ロジックを実行
    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    // 検証1: 異常値が検出されたことを確認
    expect(result.isValid).toBe(false);
    expect(result.anomalies.length).toBeGreaterThan(0);

    // 検証2: 異常値の詳細情報を確認
    const anomaly = result.anomalies[0];
    expect(anomaly.fieldName).toBe("agreementCount");
    expect(anomaly.actualValue).toBe(8);
    expect(anomaly.expectedMaxValue).toBe(5);
    expect(anomaly.anomalyType).toBe("EXCEEDS_REFERENCE");

    // 検証3: 通知が即座に発行されたことを確認
    expect(notificationLog.length).toBe(1);
    const notification = notificationLog[0];
    expect(notification.customerId).toBe("CUST-001");
    expect(notification.severity).toBe("HIGH");
    expect(notification.detectedAt).toEqual(
      new Date("2024-01-15T09:30:00Z")
    );

    // 検証4: 通知内容に異常値の詳細情報が含まれていることを確認
    expect(notification.message).toContain("成約数");
    expect(notification.message).toContain("アポ数");
    expect(notification.details).toEqual({
      fieldName: "agreementCount",
      actualValue: 8,
      expectedMaxValue: 5,
      unit: "件",
    });

    // 検証5: 通知送信の遅延がないことを確認（タイムスタンプが入力と一致）
    expect(notification.detectedAt.getTime()).toBe(
      input.timestamp.getTime()
    );
  });

  // 負の値パターンのテスト
  test("should detect and notify when appointment count is negative", () => {
    const input = {
      customerId: "CUST-002",
      appointmentCount: -3,
      agreementCount: 2,
      responseCount: 1,
      timestamp: new Date("2024-01-15T10:00:00Z"),
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    expect(result.isValid).toBe(false);
    expect(result.anomalies.length).toBeGreaterThan(0);

    const anomaly = result.anomalies.find(
      (a) => a.fieldName === "appointmentCount"
    );
    expect(anomaly).toBeDefined();
    expect(anomaly?.anomalyType).toBe("NEGATIVE_VALUE");
    expect(anomaly?.actualValue).toBe(-3);

    expect(notificationLog.length).toBeGreaterThan(0);
    const notification = notificationLog[0];
    expect(notification.severity).toBe("HIGH");
    expect(notification.message).toContain("アポ数");
    expect(notification.details.actualValue).toBe(-3);
  });

  // 不正な形式パターンのテスト
  test("should detect and notify when response count exceeds total interactions", () => {
    const input = {
      customerId: "CUST-003",
      appointmentCount: 10,
      agreementCount: 3,
      responseCount: 15,
      timestamp: new Date("2024-01-15T11:15:00Z"),
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    expect(result.isValid).toBe(false);
    expect(result.anomalies.length).toBeGreaterThan(0);

    const anomaly = result.anomalies.find(
      (a) => a.fieldName === "responseCount"
    );
    expect(anomaly).toBeDefined();
    expect(anomaly?.anomalyType).toBe("EXCEEDS_REFERENCE");

    expect(notificationLog.length).toBeGreaterThan(0);
    const notification = notificationLog[0];
    expect(notification.severity).toBe("HIGH");
    expect(notification.message).toContain("顧客反応");
  });

  // 複数の異常値が同時に検出された場合のテスト
  test("should detect and notify for multiple anomalies simultaneously", () => {
    const input = {
      customerId: "CUST-004",
      appointmentCount: -5,
      agreementCount: 12,
      responseCount: 20,
      timestamp: new Date("2024-01-15T14:45:00Z"),
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    expect(result.isValid).toBe(false);
    expect(result.anomalies.length).toBeGreaterThanOrEqual(2);

    // 複数の異常が検出されたことを確認
    const anomalyTypes = result.anomalies.map((a) => a.anomalyType);
    expect(anomalyTypes).toContain("NEGATIVE_VALUE");
    expect(anomalyTypes).toContain("EXCEEDS_REFERENCE");

    // 複数の通知が即座に発行されたことを確認
    expect(notificationLog.length).toBeGreaterThanOrEqual(2);

    // すべての通知が一貫した形式であることを確認
    notificationLog.forEach((notif) => {
      expect(notif.severity).toBe("HIGH");
      expect(notif.customerId).toBe("CUST-004");
      expect(notif.details).toHaveProperty("fieldName");
      expect(notif.details).toHaveProperty("actualValue");
      expect(notif.details).toHaveProperty("expectedMaxValue");
    });
  });

  // 正常値パターンのテスト（異常がない場合）
  test("should pass validation when all values are within normal range", () => {
    const input = {
      customerId: "CUST-005",
      appointmentCount: 10,
      agreementCount: 3,
      responseCount: 8,
      timestamp: new Date("2024-01-15T16:00:00Z"),
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    expect(result.isValid).toBe(true);
    expect(result.anomalies.length).toBe(0);
    expect(notificationLog.length).toBe(0);
  });

  // 境界値テスト：成約数がアポ数と同じ場合
  test("should pass validation when agreement count equals appointment count", () => {
    const input = {
      customerId: "CUST-006",
      appointmentCount: 7,
      agreementCount: 7,
      responseCount: 5,
      timestamp: new Date("2024-01-15T17:30:00Z"),
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    expect(result.isValid).toBe(true);
    expect(result.anomalies.length).toBe(0);
    expect(notificationLog.length).toBe(0);
  });

  // ゼロ値のテスト
  test("should handle zero values correctly", () => {
    const input = {
      customerId: "CUST-007",
      appointmentCount: 0,
      agreementCount: 0,
      responseCount: 0,
      timestamp: new Date("2024-01-15T18:00:00Z"),
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    expect(result.isValid).toBe(true);
    expect(result.anomalies.length).toBe(0);
    expect(notificationLog.length).toBe(0);
  });

  // 通知タイムスタンプの正確性テスト
  test("should include accurate timestamp in notification", () => {
    const testTimestamp = new Date("2024-01-16T09:00:00Z");
    const input = {
      customerId: "CUST-008",
      appointmentCount: 2,
      agreementCount: 5,
      responseCount: 4,
      timestamp: testTimestamp,
      onNotify: (notification: AnomalyNotification) => {
        notificationLog.push(notification);
      },
    };

    const result: AggregationValidationResult =
      validateSalesReportAggregation(input);

    expect(result.isValid).toBe(false);
    expect(notificationLog.length).toBeGreaterThan(0);

    const notification = notificationLog[0];
    expect(notification.detectedAt.toISOString()).toBe(
      testTimestamp.toISOString()
    );
  });
});
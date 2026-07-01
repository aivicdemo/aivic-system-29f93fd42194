import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateDeliveryFailureAndIssueAlert,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1181: [error] 配信成功・失敗判定・アラート管理 - 配信失敗時にアラートが正確に発行される
  test("配信失敗時にアラートが正確に発行される", () => {
    const now = new Date("2024-01-15T10:30:00Z");
    const deliveryAttemptId = "DEL-20240115-001";
    const targetDataId = "DATA-REP-2024-01-15-USR-12345";
    const targetCustomerId = "CUST-98765";

    // ケース 1: ネットワークエラーによる配信失敗
    const networkErrorResult = validateDeliveryFailureAndIssueAlert({
      deliveryAttemptId,
      targetDataId,
      targetCustomerId,
      failureReason: "NETWORK_ERROR",
      failureDetails: "Connection timeout after 30 seconds",
      attemptTimestamp: now,
      failureDetectedTimestamp: new Date("2024-01-15T10:30:45Z"),
      recipientEmail: "contact@customer-abc.jp",
      deliveryContent: {
        reportType: "MONTHLY_SUMMARY",
        month: "2024-01",
        dataRecordCount: 150,
      },
    });

    expect(networkErrorResult.alertGenerated).toBe(true);
    expect(networkErrorResult.alertId).toMatch(/^ALERT-\d{8}-\d{6}/);
    expect(networkErrorResult.failureCauseRecorded).toBe("NETWORK_ERROR");
    expect(networkErrorResult.targetDataIdentified).toBe(targetDataId);
    expect(networkErrorResult.targetCustomerIdentified).toBe(targetCustomerId);
    expect(networkErrorResult.alertIssuedAt).toEqual(
      new Date("2024-01-15T10:30:45Z")
    );
    expect(networkErrorResult.alertDetails).toMatchObject({
      failureReason: "NETWORK_ERROR",
      recipientEmail: "contact@customer-abc.jp",
      attemptCount: 1,
    });
    expect(networkErrorResult.logEntryCreated).toBe(true);

    // ケース 2: タイムアウトエラーによる配信失敗
    const timeoutErrorResult = validateDeliveryFailureAndIssueAlert({
      deliveryAttemptId: "DEL-20240115-002",
      targetDataId: "DATA-REP-2024-01-15-USR-54321",
      targetCustomerId: "CUST-11111",
      failureReason: "TIMEOUT",
      failureDetails: "HTTP request exceeded 120 second limit",
      attemptTimestamp: new Date("2024-01-15T10:45:00Z"),
      failureDetectedTimestamp: new Date("2024-01-15T10:47:00Z"),
      recipientEmail: "admin@customer-xyz.jp",
      deliveryContent: {
        reportType: "MONTHLY_SUMMARY",
        month: "2024-01",
        dataRecordCount: 200,
      },
    });

    expect(timeoutErrorResult.alertGenerated).toBe(true);
    expect(timeoutErrorResult.failureCauseRecorded).toBe("TIMEOUT");
    expect(timeoutErrorResult.alertIssuedAt).toEqual(
      new Date("2024-01-15T10:47:00Z")
    );
    expect(timeoutErrorResult.alertDetails).toMatchObject({
      failureReason: "TIMEOUT",
      recipientEmail: "admin@customer-xyz.jp",
    });
    expect(timeoutErrorResult.logEntryCreated).toBe(true);

    // ケース 3: 複数の失敗に対して個別アラートが発行される
    const thirdFailureResult = validateDeliveryFailureAndIssueAlert({
      deliveryAttemptId: "DEL-20240115-003",
      targetDataId: "DATA-REP-2024-01-15-USR-99999",
      targetCustomerId: "CUST-22222",
      failureReason: "INVALID_RECIPIENT",
      failureDetails: "Recipient email address is invalid or unreachable",
      attemptTimestamp: new Date("2024-01-15T11:00:00Z"),
      failureDetectedTimestamp: new Date("2024-01-15T11:00:15Z"),
      recipientEmail: "invalid@example.invalid",
      deliveryContent: {
        reportType: "MONTHLY_SUMMARY",
        month: "2024-01",
        dataRecordCount: 175,
      },
    });

    expect(thirdFailureResult.alertGenerated).toBe(true);
    expect(thirdFailureResult.failureCauseRecorded).toBe("INVALID_RECIPIENT");
    expect(thirdFailureResult.alertId).not.toEqual(networkErrorResult.alertId);
    expect(thirdFailureResult.alertId).not.toEqual(timeoutErrorResult.alertId);
    expect(thirdFailureResult.alertIssuedAt).toEqual(
      new Date("2024-01-15T11:00:15Z")
    );
    expect(thirdFailureResult.logEntryCreated).toBe(true);

    // ケース 4: 失敗データレコード情報が正確に特定されている
    expect(networkErrorResult.affectedDataRecordCount).toBe(150);
    expect(timeoutErrorResult.affectedDataRecordCount).toBe(200);
    expect(thirdFailureResult.affectedDataRecordCount).toBe(175);

    // ケース 5: ログエントリに詳細情報が含まれている
    expect(networkErrorResult.logDetails).toMatchObject({
      deliveryAttemptId,
      targetDataId,
      targetCustomerId,
      failureReason: "NETWORK_ERROR",
      failureDetails: "Connection timeout after 30 seconds",
      recipientEmail: "contact@customer-abc.jp",
      alertIssuedAt: expect.any(Date),
    });

    expect(timeoutErrorResult.logDetails).toMatchObject({
      deliveryAttemptId: "DEL-20240115-002",
      failureReason: "TIMEOUT",
      failureDetails: "HTTP request exceeded 120 second limit",
    });

    // ケース 6: 業務ルールエラーケース：失敗原因が不正な形式
    expect(() =>
      validateDeliveryFailureAndIssueAlert({
        deliveryAttemptId: "DEL-20240115-004",
        targetDataId: "DATA-REP-2024-01-15-USR-88888",
        targetCustomerId: "CUST-33333",
        failureReason: "INVALID_REASON_FORMAT",
        failureDetails: "Unknown failure reason code",
        attemptTimestamp: new Date("2024-01-15T11:15:00Z"),
        failureDetectedTimestamp: new Date("2024-01-15T11:15:10Z"),
        recipientEmail: "test@example.com",
        deliveryContent: {
          reportType: "MONTHLY_SUMMARY",
          month: "2024-01",
          dataRecordCount: 100,
        },
      })
    ).toThrow(/失敗原因/);

    // ケース 7: 業務ルールエラーケース：タイムスタンプが不正
    expect(() =>
      validateDeliveryFailureAndIssueAlert({
        deliveryAttemptId: "DEL-20240115-005",
        targetDataId: "DATA-REP-2024-01-15-USR-77777",
        targetCustomerId: "CUST-44444",
        failureReason: "NETWORK_ERROR",
        failureDetails: "Connection timeout",
        attemptTimestamp: new Date("2024-01-15T11:30:00Z"),
        failureDetectedTimestamp: new Date("2024-01-15T11:25:00Z"),
        recipientEmail: "test@example.com",
        deliveryContent: {
          reportType: "MONTHLY_SUMMARY",
          month: "2024-01",
          dataRecordCount: 120,
        },
      })
    ).toThrow(/タイムスタンプ/);
  });
});
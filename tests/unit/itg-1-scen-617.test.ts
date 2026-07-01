import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  notifyBillingCorrectionRequest,
  NotifyBillingCorrectionRequestInput,
  NotifyBillingCorrectionRequestOutput,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-617
  test("異議対応ルート分岐 - 修正対応要請が営業代行企業と顧客企業の両者に通知される", () => {
    const correctionRequestId = "CR-20240115-001";
    const salesAgentCompanyId = "SA-2024-001";
    const customerCompanyId = "CUST-2024-001";
    const correctionDetails =
      "売上データの計上日が契約条件と一致していません。修正が必要です。";
    const correctionType = "修正対応";
    const requestTimestamp = new Date("2024-01-15T10:30:00Z");

    const input: NotifyBillingCorrectionRequestInput = {
      correctionRequestId,
      salesAgentCompanyId,
      customerCompanyId,
      correctionDetails,
      correctionType,
      requestTimestamp,
      salesAgentContactEmail: "operator@sales-agent.com",
      customerContactEmail: "manager@customer.com",
    };

    const result: NotifyBillingCorrectionRequestOutput =
      notifyBillingCorrectionRequest(input);

    // 修正対応要請が正常に生成されたことを確認
    expect(result.correctionRequestId).toBe(correctionRequestId);
    expect(result.correctionType).toBe(correctionType);
    expect(result.status).toBe("通知送信完了");

    // 営業代行企業への通知ログを検証
    expect(result.notificationLogs).toHaveLength(2);

    const salesAgentNotification = result.notificationLogs.find(
      (log) => log.recipientType === "営業代行企業"
    );
    expect(salesAgentNotification).toBeDefined();
    expect(salesAgentNotification?.recipientId).toBe(salesAgentCompanyId);
    expect(salesAgentNotification?.correctionRequestId).toBe(
      correctionRequestId
    );
    expect(salesAgentNotification?.notificationTimestamp).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );
    expect(salesAgentNotification?.notificationContent).toContain(
      correctionDetails
    );
    expect(salesAgentNotification?.deliveryStatus).toBe("配信成功");

    // 顧客企業への通知ログを検証
    const customerNotification = result.notificationLogs.find(
      (log) => log.recipientType === "顧客企業"
    );
    expect(customerNotification).toBeDefined();
    expect(customerNotification?.recipientId).toBe(customerCompanyId);
    expect(customerNotification?.correctionRequestId).toBe(
      correctionRequestId
    );
    expect(customerNotification?.notificationTimestamp).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );
    expect(customerNotification?.notificationContent).toContain(
      correctionDetails
    );
    expect(customerNotification?.deliveryStatus).toBe("配信成功");

    // 両者への通知タイムスタンプが同じであることを確認
    expect(salesAgentNotification?.notificationTimestamp).toEqual(
      customerNotification?.notificationTimestamp
    );

    // 両者への通知内容が同一であることを確認
    expect(salesAgentNotification?.notificationContent).toBe(
      customerNotification?.notificationContent
    );

    // 通知内容に修正対応要請の詳細情報が含まれていることを確認
    expect(salesAgentNotification?.notificationContent).toContain(
      correctionRequestId
    );
    expect(salesAgentNotification?.notificationContent).toContain(
      correctionType
    );
    expect(customerNotification?.notificationContent).toContain(
      correctionRequestId
    );
    expect(customerNotification?.notificationContent).toContain(
      correctionType
    );

    // 修正対応要請のステータス遷移が正常に進行していることを確認
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.initiatedAt).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );
    expect(result.auditLog.correctionRequestId).toBe(correctionRequestId);
    expect(result.auditLog.processedBy).toBe("システム自動処理");
  });
});
import { retryAccountingSystemApi } from "../../src/logic/it-1-2-1";

const fetchMock = require("jest-fetch-mock");

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1276: [error] 会計システムAPI連携機能 - 連続再試行失敗時にアラート通知が送信される
  test("連続3回のAPI再試行がすべて失敗した場合、アラート通知がシステム管理者に送信される", async () => {
    fetchMock.resetMocks();

    // 会計システムAPIをモック化し、すべてのリクエストに対してタイムアウトエラーを返す
    const timeoutError = new Error("Request timeout");
    timeoutError.name = "TimeoutError";

    fetchMock.mockRejectOnce(timeoutError);
    fetchMock.mockRejectOnce(timeoutError);
    fetchMock.mockRejectOnce(timeoutError);

    const testData = {
      dataId: "DATA-20240115-001",
      customerId: "CUST-A001",
      serviceId: "SVC-SALES",
      billingAmount: 150000,
      billingDate: new Date("2024-01-15T09:00:00Z"),
    };

    const result = await retryAccountingSystemApi({
      billingData: testData,
      maxRetries: 3,
      retryDelayMs: 100,
    });

    // API連携が最大再試行回数(3回)すべて失敗したことを確認
    expect(result.success).toBe(false);
    expect(result.retryCount).toBe(3);
    expect(result.lastError).toMatch(/timeout/i);

    // アラート通知が生成されたことを確認
    expect(result.alertNotification).toBeDefined();
    expect(result.alertNotification.recipientType).toBe("system_admin");
    expect(result.alertNotification.severity).toBe("critical");

    // アラート通知にエラーの詳細情報が含まれていることを確認
    const alertContent = result.alertNotification.content;
    expect(alertContent).toContain(testData.dataId);
    expect(alertContent).toContain("3");
    expect(alertContent).toMatch(/timeout/i);

    // 通知のタイムスタンプが記録されていることを確認
    expect(result.alertNotification.timestamp).toBeDefined();
    const notificationTime = new Date(result.alertNotification.timestamp);
    expect(notificationTime.getTime()).toBeGreaterThan(0);
    expect(notificationTime.getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );

    // 失敗回数がアラート通知に正確に記録されていることを確認
    expect(result.alertNotification.retryAttempts).toBe(3);
    expect(result.alertNotification.dataId).toBe(testData.dataId);
    expect(result.alertNotification.customerId).toBe(testData.customerId);

    // アラート通知が送信対象のシステム管理者に指定されていることを確認
    expect(result.alertNotification.recipientEmail).toBeDefined();
    expect(result.alertNotification.recipientEmail).toMatch(/@/);
  });
});
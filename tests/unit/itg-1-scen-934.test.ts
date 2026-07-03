import { validateAndDistributeInvoiceReport } from "../../src/logic/it-1-2-1";

describe("請求書・報告書配信機能 - 配信先設定バリデーション", () => {
  test("SCEN-934: 配信先設定が空の場合、エラーコードとエラーメッセージを返す", () => {
    // Arrange: 配信先設定が空の請求書データを準備
    const invoiceReportData = {
      invoiceId: "INV-2024-001",
      customerId: "CUST-123",
      serviceId: "SVC-456",
      amount: 100000,
      invoiceDate: "2024-01-15",
      recipientEmail: "",
      recipientName: "",
      distributionChannels: [],
    };

    // Act: 配信機能の実行メソッドを呼び出す
    const result = validateAndDistributeInvoiceReport(invoiceReportData);

    // Assert: エラーハンドリングの確認
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("E001_EMPTY_RECIPIENT");
    expect(result.errorMessage).toBe("配信先が設定されていません");
    expect(result.distributionStatus).toBe("failed");
    expect(result.logEntry).toMatchObject({
      timestamp: expect.any(String),
      invoiceId: "INV-2024-001",
      status: "failed",
      reason: "配信先が設定されていません",
    });
  });
});
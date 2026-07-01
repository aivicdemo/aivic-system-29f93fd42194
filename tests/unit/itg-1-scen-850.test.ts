import { notifyContractChangeToCustomer } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理", () => {
  test("SCEN-850: 顧客企業営業責任者のメールアドレスが未登録の場合、メール送信エラーを検出する", async () => {
    // Arrange: メールアドレスなしの顧客企業契約情報
    const contractChangeInput = {
      contractId: "CTR-2024-001",
      customerId: "CUST-5001",
      contractAmount: 500000,
      contractStartDate: "2024-01-01",
      contractEndDate: "2024-12-31",
      changedAmount: 600000,
      changedEndDate: "2025-06-30",
      changedAt: "2024-01-15T09:00:00Z",
      changedBy: "OPR-001",
    };

    const customerContactInfo = {
      customerId: "CUST-5001",
      customerName: "テスト顧客企業",
      responsiblePersonName: "営業責任者太郎",
      emailAddress: "", // メールアドレス未登録
    };

    // Act & Assert: メール送信エラーが発生することを検証
    const result = await notifyContractChangeToCustomer(
      contractChangeInput,
      customerContactInfo
    );

    // メール送信失敗が正しく検出されている
    expect(result.status).toBe("failed");
    expect(result.errorType).toBe("missing_email_address");
    expect(result.notificationSent).toBe(false);

    // エラーログに詳細なエラーメッセージが記録されている
    expect(result.errorLog).toMatch(/メールアドレス/);
    expect(result.errorLog).toMatch(/登録されていない/);

    // 契約変更処理自体は完了（ステータスは「処理完了・通知失敗」）
    expect(result.contractChangeProcessed).toBe(true);
    expect(result.notificationStatus).toBe("failed");

    // 管理者へのエラー通知が生成されている
    expect(result.adminNotificationIssued).toBe(true);
    expect(result.adminNotificationContent).toContain("CUST-5001");
    expect(result.adminNotificationContent).toContain("メール送信失敗");

    // タイムスタンプが記録されている
    expect(result.errorDetectedAt).toBeDefined();
    expect(typeof result.errorDetectedAt).toBe("string");
  });
});
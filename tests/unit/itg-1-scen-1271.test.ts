import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1271: [error] 請求情報最終承認機能 - 品質チェック未完了の請求情報は差戻しとなり修正対象が通知される
  test("品質チェック未完了の請求情報の承認は失敗し、差戻し状態と修正通知が実行される", async () => {
    const { approveInvoiceInfo } = await import(
      "../../src/logic/it-1781935279444-2-2-1"
    );

    // テストデータ: 品質チェック未完了の請求情報
    const invoiceInfoIncomplete = {
      invoiceId: "INV-2024-001",
      customerId: "CUST-ABC",
      serviceId: "SVC-001",
      invoiceAmount: 50000,
      qualityCheckStatus: "incomplete", // 品質チェック未完了
      invoiceItems: [
        {
          itemId: "ITEM-001",
          itemName: "アポイント件数",
          quantity: 10,
          unitPrice: 5000,
        },
      ],
      approvalRequestedAt: "2024-01-15T10:00:00Z",
      approvalRequestedBy: "USER-001",
      notes: "",
    };

    // 承認実行時にエラーが投げられることを確認（品質チェック未完了）
    expect(() =>
      approveInvoiceInfo({
        invoiceInfo: invoiceInfoIncomplete,
        approverUserId: "USER-APPROVER",
        approvalTimestamp: "2024-01-15T11:00:00Z",
      })
    ).toThrow(/品質チェック/);

    // テストデータ: 品質チェック完了の請求情報（成功パターンで検証）
    const invoiceInfoComplete = {
      invoiceId: "INV-2024-002",
      customerId: "CUST-ABC",
      serviceId: "SVC-001",
      invoiceAmount: 50000,
      qualityCheckStatus: "complete", // 品質チェック完了
      invoiceItems: [
        {
          itemId: "ITEM-001",
          itemName: "アポイント件数",
          quantity: 10,
          unitPrice: 5000,
        },
      ],
      approvalRequestedAt: "2024-01-15T10:00:00Z",
      approvalRequestedBy: "USER-001",
      notes: "確認済み",
    };

    // 品質チェック完了時は承認が成功する
    const approvalResult = approveInvoiceInfo({
      invoiceInfo: invoiceInfoComplete,
      approverUserId: "USER-APPROVER",
      approvalTimestamp: "2024-01-15T11:00:00Z",
    });

    // 承認ステータスが「承認済み」になることを確認
    expect(approvalResult.approvalStatus).toBe("approved");

    // 承認者情報が記録されることを確認
    expect(approvalResult.approvedBy).toBe("USER-APPROVER");
    expect(approvalResult.approvedAt).toBe("2024-01-15T11:00:00Z");

    // 品質チェック未完了時の差戻し検証
    const rejectionResult = approveInvoiceInfo({
      invoiceInfo: invoiceInfoIncomplete,
      approverUserId: "USER-APPROVER",
      approvalTimestamp: "2024-01-15T11:00:00Z",
      forceReject: true, // 強制差戻しフラグ
    });

    // 承認ステータスが「差戻し」になることを確認
    expect(rejectionResult.approvalStatus).toBe("rejected");

    // 差戻し理由に「品質チェック」が含まれることを確認
    expect(rejectionResult.rejectionReason).toMatch(/品質チェック/);

    // 修正対象の詳細情報が含まれることを確認
    expect(rejectionResult.correctionTargets).toBeDefined();
    expect(Array.isArray(rejectionResult.correctionTargets)).toBe(true);
    expect(rejectionResult.correctionTargets.length).toBeGreaterThan(0);

    // 修正対象の通知情報を確認
    expect(rejectionResult.notifications).toBeDefined();
    expect(Array.isArray(rejectionResult.notifications)).toBe(true);

    const notification = rejectionResult.notifications[0];
    expect(notification.notificationType).toBe("correction_required");
    expect(notification.recipientUserId).toBe("USER-001"); // 承認リクエスト者に通知
    expect(notification.message).toMatch(/修正/);
    expect(notification.invoiceId).toBe("INV-2024-001");
    expect(notification.sentAt).toBeDefined();

    // 修正対象の詳細を確認
    const correctionTarget = rejectionResult.correctionTargets[0];
    expect(correctionTarget.fieldName).toBeDefined();
    expect(correctionTarget.currentValue).toBeDefined();
    expect(correctionTarget.expectedValue).toBeDefined();
    expect(correctionTarget.reason).toMatch(/品質チェック/);
  });
});
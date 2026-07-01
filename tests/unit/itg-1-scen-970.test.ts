import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-970: 営業データの正確性エラー（重複記録など）を検出して修正要件を通知する", () => {
    // 重複する営業データ（同一顧客ID、取引日、金額）を2件以上登録
    const duplicateSalesData = [
      {
        recordId: "REC-001",
        customerId: "CUST-12345",
        transactionDate: "2024-01-15",
        amount: 50000,
        serviceType: "service_a",
        userId: "USER-001",
      },
      {
        recordId: "REC-002",
        customerId: "CUST-12345",
        transactionDate: "2024-01-15",
        amount: 50000,
        serviceType: "service_a",
        userId: "USER-001",
      },
      {
        recordId: "REC-003",
        customerId: "CUST-12345",
        transactionDate: "2024-01-16",
        amount: 75000,
        serviceType: "service_b",
        userId: "USER-002",
      },
    ];

    // 請求額自動計算・検証機能を実行し、営業データの品質チェック処理を開始
    const validationResult = validateSalesDataCompleteness(duplicateSalesData);

    // システムが重複記録を検出することを確認
    expect(validationResult.hasErrors).toBe(true);
    expect(validationResult.duplicateErrors).toBeDefined();
    expect(validationResult.duplicateErrors.length).toBe(1);

    // 検出された重複記録のエラー詳細情報を確認
    const duplicateError = validationResult.duplicateErrors[0];
    expect(duplicateError.errorType).toBe("重複記録");
    expect(duplicateError.recordIds).toEqual(["REC-001", "REC-002"]);
    expect(duplicateError.customerId).toBe("CUST-12345");
    expect(duplicateError.transactionDate).toBe("2024-01-15");
    expect(duplicateError.amount).toBe(50000);
    expect(duplicateError.affectedBillingAmount).toBe(50000);

    // 修正要件通知機能が実行され、通知メッセージが生成されることを確認
    expect(validationResult.notifications).toBeDefined();
    expect(validationResult.notifications.length).toBeGreaterThan(0);

    const notification = validationResult.notifications[0];
    expect(notification.notificationType).toBe("重複記録検出");
    expect(notification.recipientUserId).toBe("USER-001");
    expect(notification.content).toContain("重複");
    expect(notification.content).toContain("CUST-12345");
    expect(notification.affectedBillingAmount).toBe(50000);
    expect(notification.recommendedAction).toMatch(/修正/);

    // 通知履歴がシステムに記録され、修正ステータスが「未対応」で初期化されることを確認
    expect(notification.notificationId).toBeDefined();
    expect(notification.createdAt).toBeDefined();
    expect(notification.correctionStatus).toBe("未対応");
    expect(notification.isRecorded).toBe(true);

    // 請求額の重複計算を防ぎ、正確な請求額が計算されていることを確認
    expect(validationResult.correctBillingAmount).toBe(125000);
    // REC-001, REC-003 のみをカウント（REC-002は重複）: 50000 + 75000 = 125000

    // データ品質エラーの追跡が可能な状態であることを確認
    expect(validationResult.errorTrackingId).toBeDefined();
    expect(validationResult.errorLog).toBeDefined();
    expect(validationResult.errorLog.length).toBeGreaterThan(0);
  });
});
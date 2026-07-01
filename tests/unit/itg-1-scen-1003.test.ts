import { monitorBillingTaskSLAOverdue } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次請求業務SLA管理", () => {
  test("SCEN-1003: 請求業務がSLA期限を超過した場合、代表に自動通知される", () => {
    // Arrange: テスト環境で請求業務処理を開始し、SLA期限を現在時刻の2時間前に設定
    const now = new Date("2024-11-15T14:00:00Z");
    const slaDeadlineUtc = new Date("2024-11-15T12:00:00Z"); // 2時間前
    const overageDurationMinutes = 120; // 2時間超過

    const billingTaskInput = {
      billingTaskId: "BT-202411-001",
      representativeUserId: "REP-001",
      representativeEmail: "rep@company.com",
      billingStatus: "IN_PROGRESS",
      slaDeadlineUtc: slaDeadlineUtc.toISOString(),
      currentTimeUtc: now.toISOString(),
      targetContractId: "CTR-2024-0050",
      targetCustomerId: "CUST-00123",
      customerName: "顧客企業A",
      serviceType: "営業成果報酬",
    };

    // 請求業務の処理ステータスを「進行中」に更新
    // Act: システムのSLA監視スケジューラーを実行し、期限超過チェック処理をトリガー
    const result = monitorBillingTaskSLAOverdue(billingTaskInput);

    // Assert: SLA超過フラグが true に更新されたことを確認
    expect(result.slaOverdueFlag).toBe(true);

    // 通知ログテーブルに代表宛のアラート記録が作成されたことを確認
    expect(result.notificationCreated).toBe(true);

    // 通知メッセージに請求業務ID、超過時間、対象案件情報が含まれていることを検証
    expect(result.notificationMessage).toContain("BT-202411-001");
    expect(result.notificationMessage).toContain("120分");
    expect(result.notificationMessage).toContain("顧客企業A");
    expect(result.notificationMessage).toContain("CTR-2024-0050");

    // 通知メッセージ構造体の詳細検証
    expect(result.notification).toEqual({
      notificationId: expect.any(String),
      recipientUserId: "REP-001",
      recipientEmail: "rep@company.com",
      notificationType: "SLA_OVERDUE_ALERT",
      billingTaskId: "BT-202411-001",
      contractId: "CTR-2024-0050",
      customerId: "CUST-00123",
      customerName: "顧客企業A",
      overageDurationMinutes: 120,
      slaDeadlineUtc: "2024-11-15T12:00:00Z",
      currentTimeUtc: "2024-11-15T14:00:00Z",
      createdAtUtc: expect.any(String),
      status: "SENT",
    });

    // 代表ユーザーのメール送受信ログまたは通知履歴に該当通知が記録されていることを確認
    expect(result.auditLog).toEqual({
      logId: expect.any(String),
      userId: "REP-001",
      action: "SLA_OVERDUE_NOTIFICATION_SENT",
      billingTaskId: "BT-202411-001",
      timestamp: expect.any(String),
      ipAddress: expect.any(String),
    });

    // 超過時間が正確に計算されていることを確認
    expect(result.overageDurationMinutes).toBe(120);

    // 通知が実際に送信状態であることを確認
    expect(result.notification.status).toBe("SENT");
  });
});
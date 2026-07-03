import { classifyObjectionReason, sendObjectionNotification, updateObjectionStatus } from "../../src/logic/it-1-1-1";

describe("異議申し立て・対応ルート分岐", () => {
  test("SCEN-626: 異議申し立て送信後、両者に通知が配信され修正対応ルートへ分岐される", () => {
    // ===== 前提 =====
    // 顧客企業が請求書・成果データを受け取り、確認期限が設定されている状態
    const customerId = "CUST-001";
    const contractId = "CONTRACT-001";
    const invoiceId = "INV-202401-001";
    const customerUserId = "USER-CUST-001";
    const operatorUserId = "USER-OP-001";

    const objectionInput = {
      customerId: customerId,
      contractId: contractId,
      invoiceId: invoiceId,
      submitterId: customerUserId,
      reason: "修正対応が必要",
      detail: "請求額が契約条件と異なっています。成約数の集計ミスの可能性があります。",
      submittedAt: "2024-01-15T10:30:00Z",
    };

    // ===== 分類: 異議理由の分類（修正対応ルート） =====
    const classificationResult = classifyObjectionReason({
      reason: objectionInput.reason,
      detail: objectionInput.detail,
    });

    // 期待: 「修正対応が必要」は objectionType = "修正対応" に分類される
    expect(classificationResult.objectionType).toBe("修正対応");
    expect(classificationResult.routeType).toBe("修正対応");
    expect(classificationResult.requiresModification).toBe(true);

    // ===== 通知送信: 営業代行企業と顧客企業の両者に異議申し立て通知を配信 =====
    const notificationResult = sendObjectionNotification({
      customerId: objectionInput.customerId,
      contractId: objectionInput.contractId,
      invoiceId: objectionInput.invoiceId,
      submitterId: objectionInput.submitterId,
      reason: objectionInput.reason,
      detail: objectionInput.detail,
      submittedAt: objectionInput.submittedAt,
      objectionType: classificationResult.objectionType,
    });

    // 期待: 通知が営業代行企業と顧客企業の両者に配信される
    expect(notificationResult.notificationsSent).toBe(2);
    expect(notificationResult.recipients).toContain("営業代行企業");
    expect(notificationResult.recipients).toContain("顧客企業");
    expect(notificationResult.operatorNotification).toEqual({
      recipientType: "営業代行企業",
      recipientId: operatorUserId,
      message: expect.stringContaining("修正対応が必要"),
      sentAt: expect.any(String),
      status: "送信済み",
    });
    expect(notificationResult.customerNotification).toEqual({
      recipientType: "顧客企業",
      recipientId: customerUserId,
      message: expect.stringContaining("異議申し立てが受領されました"),
      sentAt: expect.any(String),
      status: "送信済み",
    });

    // ===== ステータス更新: 異議申し立てステータスを「修正対応ルート確認中」に更新 =====
    const statusUpdateResult = updateObjectionStatus({
      customerId: objectionInput.customerId,
      contractId: objectionInput.contractId,
      invoiceId: objectionInput.invoiceId,
      submittedAt: objectionInput.submittedAt,
      currentStatus: "受領",
      newStatus: "修正対応ルート確認中",
      routeType: classificationResult.routeType,
    });

    // 期待: ステータスが「修正対応ルート確認中」に遷移
    expect(statusUpdateResult.status).toBe("修正対応ルート確認中");
    expect(statusUpdateResult.routeLink).toBe("/修正対応ルート");
    expect(statusUpdateResult.operatorCanAccess).toBe(true);
    expect(statusUpdateResult.customerCanAccess).toBe(true);

    // ===== 修正対応ルート表示: 営業代行企業側と顧客企業側で修正対応ルートリンクが表示される =====
    expect(statusUpdateResult.operatorRouteDisplay).toEqual({
      displayed: true,
      actionType: "修正対応",
      linkText: "修正対応ルートへ",
      priority: "高",
    });
    expect(statusUpdateResult.customerRouteDisplay).toEqual({
      displayed: true,
      actionType: "修正進捗確認",
      linkText: "修正状況を確認",
      priority: "高",
    });

    // ===== 修正対応プロセス進行チェック: 修正完了後の通知送信 =====
    const correctionCompletedResult = updateObjectionStatus({
      customerId: objectionInput.customerId,
      contractId: objectionInput.contractId,
      invoiceId: objectionInput.invoiceId,
      submittedAt: objectionInput.submittedAt,
      currentStatus: "修正対応ルート確認中",
      newStatus: "修正完了",
      routeType: classificationResult.routeType,
    });

    // 期待: 修正完了時に顧客企業へ通知が送信される
    expect(correctionCompletedResult.status).toBe("修正完了");
    expect(correctionCompletedResult.customerNotificationOnCompletion).toEqual({
      sent: true,
      message: expect.stringContaining("修正完了"),
      sentAt: expect.any(String),
    });

    // ===== 全体フロー検証 =====
    // 異議申し立て→分類→通知配信→ステータス更新→修正対応ルート表示→修正완료→顧客通知
    expect(notificationResult.notificationsSent).toBe(2);
    expect(statusUpdateResult.status).toBe("修正対応ルート確認中");
    expect(correctionCompletedResult.status).toBe("修正完了");
    expect(correctionCompletedResult.customerNotificationOnCompletion.sent).toBe(true);
  });
});
import { executePaymentWithValidation } from "../../src/logic/it-1781935279444-2-2-1";

describe("支払い処理実行・保留判定 - 支払い承認基準を満たさない請求情報", () => {
  // SCEN-1292
  test("支払い承認基準を満たさない請求情報について処理が保留され異常通知が発行される", () => {
    // テストデータ: 支払い承認基準を満たさない請求情報
    const invoiceData = {
      invoiceId: "INV-20240115-001",
      customerId: "CUST-0001",
      amount: 150000,
      currency: "JPY",
      description: "営業成果報酬",
      invoiceDate: "2024-01-15",
      dueDate: "2024-02-15",
      approverConfirmed: false,
      approverName: null,
      approvalTimestamp: null,
      requiredFieldsComplete: false,
      missingFields: ["approverConfirmed", "approverName"],
      amountValid: true,
      hasDataIntegrity: false,
    };

    const result = executePaymentWithValidation(invoiceData);

    // 支払い処理ステータスが「保留（PENDING）」に更新されていることを確認
    expect(result.paymentStatus).toBe("PENDING");

    // 検証結果として「承認基準不満たし」の判定が返されることを確認
    expect(result.approvalCheckPassed).toBe(false);

    // 異常通知が正常に発行されたか確認
    expect(result.anomalyNotificationIssued).toBe(true);

    // 異常通知の内容に不承認の理由が含まれていることを検証
    expect(result.notificationContent).toEqual(
      expect.objectContaining({
        invoiceId: "INV-20240115-001",
        rejectionReasons: expect.arrayContaining([
          expect.stringMatching(/approverConfirmed/),
          expect.stringMatching(/requiredFields/),
        ]),
      })
    );

    // 異常通知に請求IDが含まれていることを検証
    expect(result.notificationContent.invoiceId).toBe("INV-20240115-001");

    // 異常通知にタイムスタンプが含まれていることを検証
    expect(result.notificationContent.issuedAt).toBeDefined();
    expect(typeof result.notificationContent.issuedAt).toBe("string");

    // 請求情報のステータスが適切に更新されていることを確認
    expect(result.updatedInvoiceStatus).toBe("PENDING");

    // ログに処理内容が記録されていることを確認
    expect(result.processLog).toBeDefined();
    expect(result.processLog.length).toBeGreaterThan(0);
    expect(result.processLog[0]).toEqual(
      expect.objectContaining({
        action: "VALIDATION_FAILED",
        timestamp: expect.any(String),
        invoiceId: "INV-20240115-001",
      })
    );

    // ステータス遷移ログが記録されていることを確認
    expect(result.processLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "STATUS_UPDATE_TO_PENDING",
        }),
      ])
    );

    // 異常通知発行ログが記録されていることを確認
    expect(result.processLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "ANOMALY_NOTIFICATION_ISSUED",
        }),
      ])
    );

    // 全体の処理結果が支払い保留を示していることを確認
    expect(result.paymentExecuted).toBe(false);
    expect(result.paymentPending).toBe(true);
  });
});
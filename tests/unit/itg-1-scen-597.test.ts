import { detectAbnormalValue } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-597: [normal] 異常値検出 - 通常の請求額範囲を大幅に超える計算結果が異常値として検出される
  test("should detect abnormal billing amount exceeding normal range threshold", () => {
    // Arrange: 通常の請求額範囲としきい値を定義
    const normalRangeMaxAmount = 100000;
    const abnormalBillingAmount = 500000;
    const expectedExcessAmount = 400000; // 500,000 - 100,000

    const input = {
      billingAmount: abnormalBillingAmount,
      thresholdMaxAmount: normalRangeMaxAmount,
      customerId: "CUST-001",
      serviceId: "SRV-001",
      billingPeriod: "2024-01",
    };

    // Act: 異常値検出処理を実行
    const result = detectAbnormalValue(input);

    // Assert: 異常値として検出されたことを確認
    expect(result.isAbnormal).toBe(true);
    expect(result.statusCode).toBe("ABNORMAL_DETECTED");
    expect(result.billingAmount).toBe(500000);
    expect(result.thresholdMaxAmount).toBe(100000);
    expect(result.excessAmount).toBe(expectedExcessAmount);
    expect(result.detectionReason).toBe("AMOUNT_EXCEEDS_THRESHOLD");

    // Assert: ログ記録の確認
    expect(result.logEntry).toBeDefined();
    expect(result.logEntry.timestamp).toBeDefined();
    expect(result.logEntry.eventType).toBe("ABNORMAL_VALUE_DETECTED");
    expect(result.logEntry.customerId).toBe("CUST-001");
    expect(result.logEntry.serviceId).toBe("SRV-001");
    expect(result.logEntry.severity).toBe("HIGH");

    // Assert: アラート通知の確認
    expect(result.alertNotification).toBeDefined();
    expect(result.alertNotification.isTriggered).toBe(true);
    expect(result.alertNotification.notificationType).toBe("ADMIN_ALERT");
    expect(result.alertNotification.message).toContain("CUST-001");
    expect(result.alertNotification.message).toContain("500000");
  });
});
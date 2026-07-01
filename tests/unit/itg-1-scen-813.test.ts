import { detectDeliveryVariance } from "../../src/logic/it-1781935279444-2-1-1";

describe("納期遅延・前倒し検出・通知機能", () => {
  test("SCEN-813: 納期が前倒しされている場合に検出・フラグが立てられる", () => {
    // テストデータ: 予定納期2024年3月15日、実際納期2024年3月10日（5日前倒し）
    const plannedDeliveryDate = new Date("2024-03-15T00:00:00Z");
    const actualDeliveryDate = new Date("2024-03-10T00:00:00Z");
    const orderRecord = {
      orderId: "ORD-001",
      customerId: "CUST-123",
      plannedDeliveryDate: plannedDeliveryDate,
      actualDeliveryDate: actualDeliveryDate,
      status: "completed",
    };

    // 納期遅延・前倒し検出機能を実行
    const detectionResult = detectDeliveryVariance(orderRecord);

    // 検出結果から対象の受注レコードが返されることを確認
    expect(detectionResult).toBeDefined();
    expect(detectionResult.orderId).toBe("ORD-001");

    // 該当レコードの前倒しフラグが'true'に設定されていることを確認
    expect(detectionResult.isAdvanced).toBe(true);

    // 前倒し日数が正しく計算されていることを確認（この場合5日）
    expect(detectionResult.varianceDays).toBe(5);

    // 通知テーブルに前倒し検出に関するレコードが作成されていることを確認
    expect(detectionResult.notification).toBeDefined();
    expect(detectionResult.notification.notificationType).toBe("advanced_delivery");

    // 通知の送信ステータスが'未送信'または'送信予定'であることを確認
    expect(
      detectionResult.notification.sendStatus === "unsent" ||
        detectionResult.notification.sendStatus === "scheduled"
    ).toBe(true);

    // 通知内容に顧客ID、前倒し日数が含まれることを確認
    expect(detectionResult.notification.customerId).toBe("CUST-123");
    expect(detectionResult.notification.varianceDays).toBe(5);

    // 通知作成日時がシステム現在時刻付近であることを確認
    const notificationCreatedTime = new Date(
      detectionResult.notification.createdAt
    );
    const now = new Date();
    const timeDiffMs = now.getTime() - notificationCreatedTime.getTime();
    expect(timeDiffMs).toBeGreaterThanOrEqual(0);
    expect(timeDiffMs).toBeLessThan(5000); // 5秒以内
  });
});
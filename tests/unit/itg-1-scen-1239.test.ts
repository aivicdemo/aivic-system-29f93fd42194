import { optimizeContractChangeNotificationOrder } from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更顧客通知順序最適化機能", () => {
  test("SCEN-1239: 同一顧客の複数変更の通知が最適化順序で送信される", () => {
    // テストデータ: 同一顧客に対する3件の契約変更
    const customerId = "CUST-001";
    const contractChanges = [
      {
        contractChangeId: "CHANGE-001",
        customerId: customerId,
        changeType: "PAYMENT_METHOD",
        priority: 2,
        timestamp: new Date("2024-01-15T10:00:00Z"),
        changeContent: "支払方法を振込からクレジットカードに変更",
        notificationStatus: "PENDING",
      },
      {
        contractChangeId: "CHANGE-002",
        customerId: customerId,
        changeType: "PLAN_UPGRADE",
        priority: 1,
        timestamp: new Date("2024-01-15T09:30:00Z"),
        changeContent: "料金プランをスタンダードからプレミアムにアップグレード",
        notificationStatus: "PENDING",
      },
      {
        contractChangeId: "CHANGE-003",
        customerId: customerId,
        changeType: "OPTION_ADD",
        priority: 3,
        timestamp: new Date("2024-01-15T10:15:00Z"),
        changeContent: "データバックアップオプションを追加",
        notificationStatus: "PENDING",
      },
    ];

    // 関数実行
    const result = optimizeContractChangeNotificationOrder({
      contractChanges: contractChanges,
    });

    // 期待結果: 優先度順に最適化されたキュー（優先度1→2→3の順序）
    expect(result.optimizedQueue).toEqual([
      {
        contractChangeId: "CHANGE-002",
        customerId: "CUST-001",
        changeType: "PLAN_UPGRADE",
        priority: 1,
        timestamp: new Date("2024-01-15T09:30:00Z"),
        changeContent: "料金プランをスタンダードからプレミアムにアップグレード",
        notificationStatus: "QUEUED",
      },
      {
        contractChangeId: "CHANGE-001",
        customerId: "CUST-001",
        changeType: "PAYMENT_METHOD",
        priority: 2,
        timestamp: new Date("2024-01-15T10:00:00Z"),
        changeContent: "支払方法を振込からクレジットカードに変更",
        notificationStatus: "QUEUED",
      },
      {
        contractChangeId: "CHANGE-003",
        customerId: "CUST-001",
        changeType: "OPTION_ADD",
        priority: 3,
        timestamp: new Date("2024-01-15T10:15:00Z"),
        changeContent: "データバックアップオプションを追加",
        notificationStatus: "QUEUED",
      },
    ]);

    // 通知キューの順序検証
    expect(result.optimizedQueue.length).toBe(3);
    expect(result.optimizedQueue[0].priority).toBe(1);
    expect(result.optimizedQueue[1].priority).toBe(2);
    expect(result.optimizedQueue[2].priority).toBe(3);

    // すべての通知が同一顧客に紐付いていることを確認
    result.optimizedQueue.forEach((notification) => {
      expect(notification.customerId).toBe(customerId);
    });

    // 通知が重複していないことを確認
    const notificationIds = result.optimizedQueue.map(
      (n) => n.contractChangeId
    );
    expect(new Set(notificationIds).size).toBe(notificationIds.length);

    // 各通知の内容が正確に含まれていることを確認
    expect(result.optimizedQueue[0].changeContent).toMatch(/プレミアム/);
    expect(result.optimizedQueue[1].changeContent).toMatch(/支払方法/);
    expect(result.optimizedQueue[2].changeContent).toMatch(/バックアップ/);

    // 送信スケジュール（送信時刻の間隔）が設定されていることを確認
    expect(result.sendingSchedule).toBeDefined();
    expect(result.sendingSchedule.length).toBe(3);
    expect(result.sendingSchedule[0].delaySeconds).toBe(0);
    expect(result.sendingSchedule[1].delaySeconds).toBe(30);
    expect(result.sendingSchedule[2].delaySeconds).toBe(60);

    // 最適化処理の成功を示すステータスを確認
    expect(result.optimizationStatus).toBe("SUCCESS");
    expect(result.totalNotifications).toBe(3);
    expect(result.queuedNotifications).toBe(3);
  });
});
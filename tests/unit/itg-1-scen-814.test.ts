import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectDeliveryDelayAndNotify } from "../../src/logic/it-1781935279444-2-1-1";

describe("納期遅延・前倒し検出・通知機能", () => {
  // SCEN-814
  test("納期変更履歴がない場合にシステムが適切に処理される", () => {
    const mockDeliveryRecord = {
      delivery_id: "DLV-2024-001",
      contract_id: "CONT-2024-001",
      customer_id: "CUST-001",
      scheduled_delivery_date: "2024-12-31T23:59:59Z",
      actual_delivery_date: null,
      status: "pending",
      created_at: "2024-01-15T09:00:00Z",
      updated_at: "2024-01-15T09:00:00Z",
    };

    const mockChangeHistory = [] as Array<{
      history_id: string;
      delivery_id: string;
      previous_date: string;
      new_date: string;
      changed_at: string;
      changed_by: string;
    }>;

    const mockSystemLogs = [] as Array<{
      log_id: string;
      event_type: string;
      timestamp: string;
      message: string;
    }>;

    const mockNotifications = [] as Array<{
      notification_id: string;
      delivery_id: string;
      notification_type: string;
      created_at: string;
    }>;

    const result = detectDeliveryDelayAndNotify(
      mockDeliveryRecord,
      mockChangeHistory,
      mockSystemLogs,
      mockNotifications
    );

    expect(result.success).toBe(true);
    expect(result.error_occurred).toBe(false);
    expect(result.notification_created).toBe(false);
    expect(result.delivery_status_changed).toBe(false);

    const searchLog = mockSystemLogs.find(
      (log) => log.event_type === "DELIVERY_HISTORY_SEARCH_COMPLETED"
    );
    expect(searchLog).toBeDefined();
    expect(searchLog?.message).toMatch(/正常に完了/);

    const notificationCreated = mockNotifications.filter(
      (notif) => notif.delivery_id === mockDeliveryRecord.delivery_id
    );
    expect(notificationCreated.length).toBe(0);

    const statusChangeLog = mockSystemLogs.find(
      (log) =>
        log.event_type === "DELIVERY_STATUS_CHANGED" &&
        log.message.includes(mockDeliveryRecord.delivery_id)
    );
    expect(statusChangeLog).toBeUndefined();

    const errorLogs = mockSystemLogs.filter(
      (log) => log.event_type === "ERROR"
    );
    expect(errorLogs.length).toBe(0);

    expect(mockDeliveryRecord.status).toBe("pending");
  });
});
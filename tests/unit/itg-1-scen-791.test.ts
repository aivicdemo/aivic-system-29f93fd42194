import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  validateSlaCompliance,
  recordNotificationTimestamp,
  recordConfirmationTimestamp,
  calculateElapsedTime,
  logProcessContinuationEvent,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - SLA管理", () => {
  it("SCEN-791: 最新版リリース通知から資料確認までのSLA管理機能 - 通知から確認完了までの時間が設定SLA以内の場合、処理が続行される", () => {
    // テスト環境でSLA設定値を確認
    const sla_seconds = 86400; // 24時間 = 86400秒

    // 通知発行時刻をタイムスタンプで記録
    const notification_timestamp = new Date("2024-06-15T09:00:00Z");
    const notification_record = recordNotificationTimestamp({
      notification_id: "notif_20240615_001",
      issued_at: notification_timestamp,
      resource_type: "contract",
      resource_id: "contract_789",
      recipient_email: "sales@customer.example.com",
    });
    expect(notification_record).toEqual({
      notification_id: "notif_20240615_001",
      issued_at: notification_timestamp,
      resource_type: "contract",
      resource_id: "contract_789",
      recipient_email: "sales@customer.example.com",
      status: "issued",
    });

    // 資料確認画面にアクセスし、確認処理を実行
    // 確認完了時刻をタイムスタンプで記録（通知から12時間後 = SLA内）
    const confirmation_timestamp = new Date("2024-06-15T21:00:00Z");
    const confirmation_record = recordConfirmationTimestamp({
      notification_id: "notif_20240615_001",
      confirmed_at: confirmation_timestamp,
      confirmed_by: "user_456",
      confirmation_action: "reviewed",
    });
    expect(confirmation_record).toEqual({
      notification_id: "notif_20240615_001",
      confirmed_at: confirmation_timestamp,
      confirmed_by: "user_456",
      confirmation_action: "reviewed",
      status: "confirmed",
    });

    // 経過時間 = 確認完了時刻 - 通知発行時刻 を計算
    const elapsed_time_ms =
      confirmation_timestamp.getTime() - notification_timestamp.getTime();
    const elapsed_time_seconds = Math.floor(elapsed_time_ms / 1000);

    const elapsed_result = calculateElapsedTime({
      notification_issued_at: notification_timestamp,
      confirmation_completed_at: confirmation_timestamp,
    });
    expect(elapsed_result).toEqual({
      elapsed_seconds: 43200, // 12時間 = 43200秒
      sla_limit_seconds: sla_seconds,
      is_within_sla: true,
    });

    // 経過時間がSLA設定値以内であることを確認
    const sla_compliance_result = validateSlaCompliance({
      elapsed_seconds: elapsed_time_seconds,
      sla_limit_seconds: sla_seconds,
    });
    expect(sla_compliance_result).toEqual({
      compliant: true,
      elapsed_seconds: 43200,
      sla_limit_seconds: 86400,
      excess_seconds: 0,
    });

    // 後続の処理が正常に実行されていることを検証
    // システムログで処理継続のイベントが記録されていることを確認
    const process_log_result = logProcessContinuationEvent({
      notification_id: "notif_20240615_001",
      sla_compliant: true,
      elapsed_seconds: 43200,
      event_type: "process_continued",
      next_step: "invoice_generation",
      logged_at: new Date("2024-06-15T21:00:05Z"),
    });
    expect(process_log_result).toEqual({
      log_id: expect.any(String),
      notification_id: "notif_20240615_001",
      sla_compliant: true,
      elapsed_seconds: 43200,
      event_type: "process_continued",
      next_step: "invoice_generation",
      logged_at: new Date("2024-06-15T21:00:05Z"),
      status: "logged",
    });

    // エラーが発生しないことを確認
    expect(sla_compliance_result.compliant).toBe(true);
    expect(process_log_result.status).toBe("logged");
  });
});
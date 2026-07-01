import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateReportWithTimeoutNotification } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SCEN-1177: [error] レポート生成・配信期限管理 - レポート生成処理がタイムアウトした場合、管理者に通知が発行される
  test("レポート生成処理がタイムアウトした場合、管理者に対してタイムアウト通知が発行される", () => {
    const report_id = "REPORT-2024-001";
    const admin_user_id = "ADMIN-USR-001";
    const admin_email = "admin@example.com";
    const timeout_ms = 5000;
    const large_dataset_size = 1000000;
    const expected_timeout_timestamp = new Date("2024-01-15T10:30:00Z").toISOString();
    const expected_notification_type = "TIMEOUT_ERROR";
    const expected_notification_status = "SENT";

    const result = generateReportWithTimeoutNotification({
      report_id: report_id,
      admin_user_id: admin_user_id,
      admin_email: admin_email,
      timeout_ms: timeout_ms,
      dataset_size: large_dataset_size,
      triggered_at: new Date("2024-01-15T10:30:00Z"),
    });

    // アサーション: レポートがタイムアウトエラーを含む
    expect(result.status).toBe("TIMEOUT");
    expect(result.error_code).toBe("REPORT_GENERATION_TIMEOUT");
    expect(result.report_id).toBe(report_id);
    expect(result.timeout_duration_ms).toBe(timeout_ms);

    // アサーション: 管理者通知が生成されたことを確認
    expect(result.notification).toBeDefined();
    expect(result.notification.notification_id).toMatch(/^NOTIF-/);
    expect(result.notification.notification_type).toBe(expected_notification_type);
    expect(result.notification.recipient_user_id).toBe(admin_user_id);
    expect(result.notification.recipient_email).toBe(admin_email);

    // アサーション: 通知が発行されていることを確認
    expect(result.notification.status).toBe(expected_notification_status);
    expect(result.notification.delivered_at).toBeDefined();
    expect(typeof result.notification.delivered_at).toBe("string");

    // アサーション: 通知にレポートID、失敗理由、タイムスタンプなどの詳細情報が含まれている
    expect(result.notification.message).toContain(report_id);
    expect(result.notification.message).toContain("タイムアウト");
    expect(result.notification.details).toBeDefined();
    expect(result.notification.details.report_id).toBe(report_id);
    expect(result.notification.details.failure_reason).toBe("レポート生成処理がタイムアウト時間内に完了しませんでした");
    expect(result.notification.details.timeout_at).toBe(expected_timeout_timestamp);
    expect(result.notification.details.dataset_size).toBe(large_dataset_size);
    expect(result.notification.details.recommended_action).toMatch(/再実行|タイムアウト値の調整/);

    // アサーション: 通知に推奨アクション（レポート再生成または管理者による調査）が含まれている
    expect(result.notification.details.recommended_actions).toBeDefined();
    expect(Array.isArray(result.notification.details.recommended_actions)).toBe(true);
    expect(result.notification.details.recommended_actions.length).toBeGreaterThan(0);
    expect(result.notification.details.recommended_actions[0]).toMatch(/レポート再生成|スケジュール調整|リソース確保/);

    // アサーション: 管理者が対応可能なステータスになっていることを確認
    expect(result.notification.action_required).toBe(true);
    expect(result.notification.priority).toBe("HIGH");

    // アサーション: 通知の配信ログが記録されていることを確認
    expect(result.notification.delivery_log).toBeDefined();
    expect(result.notification.delivery_log.channel).toBe("EMAIL");
    expect(result.notification.delivery_log.attempt_count).toBe(1);
    expect(result.notification.delivery_log.success).toBe(true);
  });
});
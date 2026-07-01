import { describe, test, expect, beforeEach } from "@jest/globals";
import { executeReportDistribution } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-947
  test("配信先設定が未設定の場合、配信がスキップされ、エラー通知が代表に送信される", () => {
    const report_id = "RPT-2024-001";
    const report_type = "invoice";
    const distribution_config = {
      destination_email: null,
      destination_portal: false,
      recipient_type: null,
    };
    const admin_user_id = "USR-ADMIN-001";
    const admin_email = "admin@company.example.com";

    const result = executeReportDistribution({
      report_id,
      report_type,
      distribution_config,
      admin_user_id,
      admin_email,
      timestamp: new Date("2024-01-15T09:00:00Z"),
    });

    expect(result.distribution_executed).toBe(false);
    expect(result.skip_reason).toBe("配信先未設定");
    expect(result.system_log_recorded).toBe(true);
    expect(result.system_log_entry).toEqual({
      report_id: "RPT-2024-001",
      action: "distribution_skip",
      reason: "配信先未設定",
      timestamp: "2024-01-15T09:00:00Z",
    });
    expect(result.error_notification_sent).toBe(true);
    expect(result.notification_details).toEqual({
      recipient_user_id: "USR-ADMIN-001",
      recipient_email: "admin@company.example.com",
      message:
        "配信先未設定のため配信がスキップされました。報告書ID: RPT-2024-001",
      notification_type: "error",
      created_at: "2024-01-15T09:00:00Z",
    });
  });
});
import { describe, test, expect, beforeEach } from "@jest/globals";
import { recordAuditLogWithTimestampValidation } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-836
  test("送信日時がシステム現在時刻と大きく乖離している場合、警告が記録される", () => {
    const system_current_time = new Date("2024-12-20T10:00:00Z");
    const submission_time = new Date("2024-11-20T10:00:00Z");
    const time_difference_days = 30;
    const max_allowed_diff_days = 7;
    const is_warning_expected = true;
    const warning_level = "警告";

    const result = recordAuditLogWithTimestampValidation({
      system_current_time: system_current_time,
      submission_time: submission_time,
      response_content: "契約変更内容を確認し、顧客に回答した。",
      submitted_by_user_id: "USR-001",
      max_allowed_time_difference_days: max_allowed_diff_days,
    });

    expect(result).toEqual({
      audit_log_id: expect.any(String),
      system_timestamp: system_current_time,
      submission_timestamp: submission_time,
      time_difference_days: time_difference_days,
      has_timestamp_warning: is_warning_expected,
      warning_level: warning_level,
      warning_message:
        "送信日時がシステム現在時刻と30日の乖離があります。",
      response_content: "契約変更内容を確認し、顧客に回答した。",
      submitted_by_user_id: "USR-001",
      audit_trail_recorded: true,
      audit_record_details: {
        deviation_days: 30,
        threshold_days: 7,
        exceeds_threshold: true,
        audit_created_at: system_current_time,
      },
    });

    expect(result.has_timestamp_warning).toBe(true);
    expect(result.warning_level).toBe("警告");
    expect(result.time_difference_days).toBe(30);
    expect(result.audit_trail_recorded).toBe(true);
    expect(result.audit_record_details.exceeds_threshold).toBe(true);
    expect(result.audit_record_details.deviation_days).toBe(30);
    expect(result.audit_record_details.threshold_days).toBe(7);
  });
});
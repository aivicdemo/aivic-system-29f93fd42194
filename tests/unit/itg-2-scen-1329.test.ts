import { generateMonthlyReportSchedule } from "../../src/logic/it-1-br-2-2-2-1";

describe("月次レポートスケジュール自動決定 - 不完全な担当者割当データの処理", () => {
  // SCEN-1329
  test("担当者割当データが不完全な場合、デフォルト割当を適用して処理を継続する", () => {
    // Arrange: 不完全な担当者割当データを準備
    const incompleteAssignmentData = [
      {
        role_id: "role_001",
        role_name: "査定部署長",
        assigned_user_name: "", // 必須項目欠落
        assigned_user_email: "manager@example.com",
      },
      {
        role_id: "role_002",
        role_name: "原価管理システム運用者",
        assigned_user_name: "運用者A",
        assigned_user_email: "", // 必須項目欠落
      },
      {
        role_id: "role_003",
        role_name: "経営企画・IT部門",
        assigned_user_name: "企画担当者B",
        assigned_user_email: "planning@example.com",
      },
    ];

    const defaultAssignmentRules = {
      fallback_user_name: "システム管理者",
      fallback_user_email: "admin@example.com",
      fallback_role_name: "システム管理者",
    };

    const scheduleInput = {
      report_month: "2024-02",
      report_deadline_date: "2024-02-28",
      report_deadline_time_hm: "17:00",
      sla_completion_days: 5,
      assignment_data: incompleteAssignmentData,
      default_assignment_rules: defaultAssignmentRules,
    };

    // Act
    const result = generateMonthlyReportSchedule(scheduleInput);

    // Assert: 処理がスキップされずに実行されることを検証
    expect(result).toBeDefined();
    expect(result.schedule_generated).toBe(true);
    expect(result.report_month).toBe("2024-02");

    // デフォルト割当が適用されたことを検証
    const assignedRoles = result.role_assignment_list;
    expect(assignedRoles).toBeDefined();
    expect(Array.isArray(assignedRoles)).toBe(true);

    // 不完全なデータの担当者1（名前空欄）がデフォルト割当で補填されたか検証
    const role001Assignment = assignedRoles.find(
      (r: { role_id: string }) => r.role_id === "role_001"
    );
    expect(role001Assignment).toBeDefined();
    expect(role001Assignment.assigned_user_name).toBe("システム管理者");
    expect(role001Assignment.assigned_user_email).toBe("admin@example.com");

    // 不完全なデータの担当者2（メール空欄）がデフォルト割当で補填されたか検証
    const role002Assignment = assignedRoles.find(
      (r: { role_id: string }) => r.role_id === "role_002"
    );
    expect(role002Assignment).toBeDefined();
    expect(role002Assignment.assigned_user_name).toBe("運用者A");
    expect(role002Assignment.assigned_user_email).toBe("admin@example.com");

    // 完全なデータの担当者3は元の値を保持しているか検証
    const role003Assignment = assignedRoles.find(
      (r: { role_id: string }) => r.role_id === "role_003"
    );
    expect(role003Assignment).toBeDefined();
    expect(role003Assignment.assigned_user_name).toBe("企画担当者B");
    expect(role003Assignment.assigned_user_email).toBe("planning@example.com");

    // スケジュール日付が正しく計算されたか検証（報告期限から5営業日以内に完了）
    expect(result.report_start_date).toBe("2024-02-01");
    expect(result.report_completion_target_date).toBe("2024-02-07");
    expect(result.data_submission_deadline_date).toBe("2024-02-21");

    // 警告ログが記録されたか検証
    expect(result.warning_logs).toBeDefined();
    expect(Array.isArray(result.warning_logs)).toBe(true);
    expect(result.warning_logs.length).toBeGreaterThan(0);

    const incompleteWarnings = result.warning_logs.filter(
      (log: { message: string }) =>
        log.message.includes("不完全") ||
        log.message.includes("デフォルト")
    );
    expect(incompleteWarnings.length).toBeGreaterThanOrEqual(2);

    // 処理がスキップされていないことを確認
    expect(result.process_status).toBe("completed");
    expect(result.error_occurred).toBe(false);
  });
});
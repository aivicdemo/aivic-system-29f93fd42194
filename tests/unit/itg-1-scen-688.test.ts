import { validateReportDistributionConfig } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-688
  test("配信スケジュールが未定義の場合、レポートは配信されない", () => {
    const report_config = {
      report_id: "RPT-2024-001",
      report_name: "月次営業成果レポート",
      distribution_target_users: ["user001@example.com", "user002@example.com"],
      distribution_schedule: "",
      report_template_id: "TPL-001",
      created_at: new Date("2024-01-15T09:00:00Z"),
    };

    const validation_result = validateReportDistributionConfig(report_config);

    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.error_message).toMatch(/配信スケジュール/);
    expect(validation_result.can_distribute).toBe(false);
    expect(validation_result.skip_reason).toBe(
      "配信スケジュールが未定義のため配信をスキップしました"
    );
  });
});
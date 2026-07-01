import { generateMonthlySummaryReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1306: 品質検証が未完了の営業データがある場合、レポート生成が中断され検証エラーが通知される", () => {
    const sales_data_incomplete = [
      {
        id: "SD001",
        customer_id: "CUST001",
        service_id: "SVC001",
        appointment_count: 5,
        contract_count: 2,
        customer_response: "positive",
        quality_validation_status: "incomplete",
        created_at: "2024-01-10T09:00:00Z"
      },
      {
        id: "SD002",
        customer_id: "CUST002",
        service_id: "SVC002",
        appointment_count: 8,
        contract_count: 3,
        customer_response: "neutral",
        quality_validation_status: "incomplete",
        created_at: "2024-01-11T10:00:00Z"
      },
      {
        id: "SD003",
        customer_id: "CUST003",
        service_id: "SVC001",
        appointment_count: 10,
        contract_count: 4,
        customer_response: "positive",
        quality_validation_status: "completed",
        created_at: "2024-01-12T11:00:00Z"
      }
    ];

    const report_generation_request = {
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      template_id: "TMPL001",
      generated_by: "operator_001",
      generated_at: "2024-01-31T17:00:00Z"
    };

    const result = generateMonthlySummaryReport(
      sales_data_incomplete,
      report_generation_request
    );

    expect(result.status).toBe("failed");
    expect(result.error_code).toBe("VALIDATION_INCOMPLETE");
    expect(result.incomplete_data_count).toBe(2);
    expect(result.error_message).toMatch(/品質検証が未完了/);
    expect(result.error_message).toMatch(/未完了データ件数: 2件/);
    expect(result.report_data).toBeNull();
    expect(result.should_notify_admin).toBe(true);
    expect(result.should_notify_reporter).toBe(true);
    expect(result.incomplete_record_ids).toEqual(["SD001", "SD002"]);
  });
});
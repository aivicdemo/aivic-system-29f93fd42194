import { generateMonthlySummaryReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1305: 品質検証完了・請求承認済みの営業データから月次サマリーレポートが定義済みテンプレートに基づいて生成される", () => {
    const validated_sales_data_records = [
      {
        sales_data_id: "SD-001",
        customer_id: "CUST-A",
        service_id: "SVC-1",
        appointment_count: 5,
        contract_count: 2,
        contract_amount: 50000,
        customer_response_score: 85,
        validation_status: "PASSED",
        billing_approval_status: "APPROVED",
        period_start_date: "2024-01-01",
        period_end_date: "2024-01-31",
      },
      {
        sales_data_id: "SD-002",
        customer_id: "CUST-B",
        service_id: "SVC-2",
        appointment_count: 3,
        contract_count: 1,
        contract_amount: 25000,
        customer_response_score: 78,
        validation_status: "PASSED",
        billing_approval_status: "APPROVED",
        period_start_date: "2024-01-01",
        period_end_date: "2024-01-31",
      },
    ];

    const template_definition = {
      template_id: "TMPL-MONTHLY-001",
      template_name: "月次営業成果サマリー",
      version: "1.0",
      effective_date: "2024-01-01",
      header_section: {
        title: "月次営業成果レポート",
        report_period_label: "集計期間",
        generated_date_label: "生成日時",
      },
      data_section_items: [
        {
          item_id: "DSI-001",
          item_name: "顧客数",
          calculation_logic: "DISTINCT_COUNT(customer_id)",
          display_order: 1,
        },
        {
          item_id: "DSI-002",
          item_name: "合計アポイント数",
          calculation_logic: "SUM(appointment_count)",
          display_order: 2,
        },
        {
          item_id: "DSI-003",
          item_name: "合計成約数",
          calculation_logic: "SUM(contract_count)",
          display_order: 3,
        },
        {
          item_id: "DSI-004",
          item_name: "合計契約金額",
          calculation_logic: "SUM(contract_amount)",
          display_order: 4,
        },
        {
          item_id: "DSI-005",
          item_name: "平均顧客反応スコア",
          calculation_logic: "AVG(customer_response_score)",
          display_order: 5,
        },
      ],
      footer_section: {
        approval_status_label: "承認状態",
        generated_by_label: "生成者",
      },
    };

    const report_generation_request = {
      template_id: "TMPL-MONTHLY-001",
      period_start_date: "2024-01-01",
      period_end_date: "2024-01-31",
      sales_data_records: validated_sales_data_records,
    };

    const generated_report = generateMonthlySummaryReport(
      report_generation_request,
      template_definition
    );

    expect(generated_report).toBeDefined();
    expect(generated_report.report_id).toMatch(/^RPT-/);
    expect(generated_report.template_id).toBe("TMPL-MONTHLY-001");
    expect(generated_report.template_name).toBe("月次営業成果サマリー");

    expect(generated_report.header.title).toBe("月次営業成果レポート");
    expect(generated_report.header.report_period).toBe(
      "2024-01-01 ～ 2024-01-31"
    );
    expect(generated_report.header.generated_date).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(generated_report.data_section).toBeDefined();
    expect(generated_report.data_section.total_customers).toBe(2);
    expect(generated_report.data_section.total_appointments).toBe(8);
    expect(generated_report.data_section.total_contracts).toBe(3);
    expect(generated_report.data_section.total_contract_amount).toBe(75000);
    expect(generated_report.data_section.average_customer_response_score).toBe(
      81.5
    );

    expect(generated_report.data_items).toHaveLength(5);
    expect(generated_report.data_items[0]).toEqual({
      item_id: "DSI-001",
      item_name: "顧客数",
      value: 2,
      display_order: 1,
    });
    expect(generated_report.data_items[1]).toEqual({
      item_id: "DSI-002",
      item_name: "合計アポイント数",
      value: 8,
      display_order: 2,
    });
    expect(generated_report.data_items[2]).toEqual({
      item_id: "DSI-003",
      item_name: "合計成約数",
      value: 3,
      display_order: 3,
    });
    expect(generated_report.data_items[3]).toEqual({
      item_id: "DSI-004",
      item_name: "合計契約金額",
      value: 75000,
      display_order: 4,
    });
    expect(generated_report.data_items[4]).toEqual({
      item_id: "DSI-005",
      item_name: "平均顧客反応スコア",
      value: 81.5,
      display_order: 5,
    });

    expect(generated_report.footer).toBeDefined();
    expect(generated_report.footer.approval_status).toBe("APPROVED");
    expect(generated_report.footer.generated_by).toBe("SYSTEM_AUTO");

    expect(generated_report.format_status).toBe("VALID");
    expect(generated_report.output_file_path).toMatch(/\.pdf$/);
    expect(generated_report.generation_status).toBe("SUCCESS");
    expect(generated_report.generated_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(generated_report.all_records_validated).toBe(true);
    expect(generated_report.all_records_billing_approved).toBe(true);
  });
});
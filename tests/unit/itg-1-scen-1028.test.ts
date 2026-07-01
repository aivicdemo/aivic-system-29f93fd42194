import { validateSalesDataAgainstRules } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データの検証ルール確認と品質基準の明確化", () => {
  // SCEN-1028
  test("複数の検証ルールが組み合わせられて確認される", () => {
    const testDataset = [
      {
        id: "sales_001",
        customer_name: "ABC株式会社",
        contact_date: "2024-01-15",
        sales_amount: 150000,
        appointment_status: "confirmed",
        service_type: "premium",
      },
      {
        id: "sales_002",
        customer_name: "",
        contact_date: "2024-01-16",
        sales_amount: 75000,
        appointment_status: "pending",
        service_type: "standard",
      },
      {
        id: "sales_003",
        customer_name: "XYZ商事",
        contact_date: "invalid-date",
        sales_amount: 200000,
        appointment_status: "confirmed",
        service_type: "premium",
      },
      {
        id: "sales_004",
        customer_name: "DEF企業",
        contact_date: "2024-01-17",
        sales_amount: -50000,
        appointment_status: "rejected",
        service_type: "basic",
      },
      {
        id: "sales_005",
        customer_name: "GHI株式会社",
        contact_date: "2024-01-18",
        sales_amount: 120000,
        appointment_status: "confirmed",
        service_type: "premium",
      },
    ];

    const validationRules = [
      {
        rule_id: "rule_customer_required",
        field: "customer_name",
        type: "required",
        error_message: "顧客名は必須項目です",
      },
      {
        rule_id: "rule_date_format",
        field: "contact_date",
        type: "format",
        format_pattern: "YYYY-MM-DD",
        error_message: "接触日付はYYYY-MM-DD形式である必要があります",
      },
      {
        rule_id: "rule_amount_range",
        field: "sales_amount",
        type: "range",
        min_value: 0,
        max_value: 500000,
        error_message: "売上金額は0以上500000以下である必要があります",
      },
    ];

    const result = validateSalesDataAgainstRules(testDataset, validationRules);

    expect(result).toEqual({
      total_records: 5,
      passed_records: 2,
      failed_records: 3,
      quality_achievement_rate: 40,
      validation_errors: [
        {
          record_id: "sales_002",
          field: "customer_name",
          rule_id: "rule_customer_required",
          error_message: "顧客名は必須項目です",
          severity: "error",
        },
        {
          record_id: "sales_003",
          field: "contact_date",
          rule_id: "rule_date_format",
          error_message: "接触日付はYYYY-MM-DD形式である必要があります",
          severity: "error",
        },
        {
          record_id: "sales_004",
          field: "sales_amount",
          rule_id: "rule_amount_range",
          error_message: "売上金額は0以上500000以下である必要があります",
          severity: "error",
        },
      ],
      passed_record_ids: ["sales_001", "sales_005"],
      failed_record_ids: ["sales_002", "sales_003", "sales_004"],
      dashboard_summary: {
        all_rules_applied: true,
        combined_rule_execution_count: 15,
        total_rule_violations: 3,
        quality_threshold_met: false,
      },
    });

    expect(result.passed_records).toBe(2);
    expect(result.failed_records).toBe(3);
    expect(result.quality_achievement_rate).toBe(40);
    expect(result.validation_errors.length).toBe(3);
    expect(result.dashboard_summary.all_rules_applied).toBe(true);
    expect(result.dashboard_summary.combined_rule_execution_count).toBe(15);
    expect(result.dashboard_summary.quality_threshold_met).toBe(false);
  });
});
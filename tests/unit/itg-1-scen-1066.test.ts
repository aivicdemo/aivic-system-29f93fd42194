import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証機能", () => {
  // SCEN-1066: [normal] 営業データ品質検証機能 - 営業データが検証ルールに基づいて完全性・正確性が確認され、異常なし と判定される
  test("完全かつ正確な営業データが検証ルールに基づいて合格と判定される", () => {
    const valid_sales_data = {
      customer_name: "株式会社テスト",
      contact_date: "2024-01-15T10:30:00Z",
      outcome_content: "アポイント確定",
      appointment_confirmed: true,
      amount: 150000,
      service_type: "consulting",
      sales_representative: "田中太郎",
    };

    const validation_rules = [
      {
        rule_id: "rule_001",
        field_name: "customer_name",
        rule_type: "required",
        is_mandatory: true,
      },
      {
        rule_id: "rule_002",
        field_name: "contact_date",
        rule_type: "date_format",
        expected_format: "ISO8601",
      },
      {
        rule_id: "rule_003",
        field_name: "outcome_content",
        rule_type: "required",
        is_mandatory: true,
      },
      {
        rule_id: "rule_004",
        field_name: "appointment_confirmed",
        rule_type: "data_type",
        expected_type: "boolean",
      },
      {
        rule_id: "rule_005",
        field_name: "amount",
        rule_type: "range",
        min_value: 0,
        max_value: 10000000,
      },
      {
        rule_id: "rule_006",
        field_name: "service_type",
        rule_type: "enum",
        allowed_values: ["consulting", "development", "support"],
      },
      {
        rule_id: "rule_007",
        field_name: "sales_representative",
        rule_type: "required",
        is_mandatory: true,
      },
    ];

    const result = validateSalesData({
      sales_data: valid_sales_data,
      validation_rules: validation_rules,
    });

    expect(result.validation_status).toBe("PASSED");
    expect(result.overall_judgment).toBe("OK");
    expect(result.validation_items.length).toBe(7);
    expect(result.validation_items.every((item) => item.result === "OK")).toBe(
      true
    );
    expect(result.error_count).toBe(0);
    expect(result.warning_count).toBe(0);
    expect(result.error_details).toEqual([]);
    expect(result.warning_details).toEqual([]);
  });
});
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  validateSalesDataForBilling,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1071: [normal] 請求対象項目自動抽出・検証機能 - 営業データから抽出した入力値が全検証ルールに合致する場合に合格と判定される
  it("should return PASS status when all sales data matches all validation rules", () => {
    const validSalesData = {
      customer_id: "CUST001",
      customer_name: "顧客企業A",
      contact_date: "2024-01-15",
      service_type: "新規営業",
      appointment_count: 5,
      deal_count: 2,
      deal_amount: 150000,
      sales_rep_id: "REP001",
      sales_rep_name: "山田太郎",
      customer_feedback: "positive",
      contract_status: "confirmed",
      billing_target_flag: true,
      data_entry_date: "2024-01-10T09:30:00Z",
    };

    const validationRules = [
      {
        rule_id: "RULE001",
        field_name: "customer_id",
        rule_type: "required",
        expected_type: "string",
        allow_null: false,
      },
      {
        rule_id: "RULE002",
        field_name: "customer_name",
        rule_type: "required",
        expected_type: "string",
        allow_null: false,
      },
      {
        rule_id: "RULE003",
        field_name: "contact_date",
        rule_type: "format",
        expected_type: "string",
        format_pattern: "YYYY-MM-DD",
      },
      {
        rule_id: "RULE004",
        field_name: "service_type",
        rule_type: "enum",
        expected_type: "string",
        allowed_values: ["新規営業", "既存営業", "コンサルティング"],
      },
      {
        rule_id: "RULE005",
        field_name: "appointment_count",
        rule_type: "range",
        expected_type: "number",
        min_value: 0,
        max_value: 1000,
      },
      {
        rule_id: "RULE006",
        field_name: "deal_count",
        rule_type: "range",
        expected_type: "number",
        min_value: 0,
        max_value: 1000,
      },
      {
        rule_id: "RULE007",
        field_name: "deal_amount",
        rule_type: "range",
        expected_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      {
        rule_id: "RULE008",
        field_name: "sales_rep_id",
        rule_type: "required",
        expected_type: "string",
        allow_null: false,
      },
      {
        rule_id: "RULE009",
        field_name: "sales_rep_name",
        rule_type: "required",
        expected_type: "string",
        allow_null: false,
      },
      {
        rule_id: "RULE010",
        field_name: "customer_feedback",
        rule_type: "enum",
        expected_type: "string",
        allowed_values: ["positive", "neutral", "negative", "no_response"],
      },
      {
        rule_id: "RULE011",
        field_name: "contract_status",
        rule_type: "enum",
        expected_type: "string",
        allowed_values: ["confirmed", "pending", "cancelled"],
      },
      {
        rule_id: "RULE012",
        field_name: "billing_target_flag",
        rule_type: "required",
        expected_type: "boolean",
        allow_null: false,
      },
    ];

    const result = validateSalesDataForBilling(validSalesData, validationRules);

    expect(result.status).toBe("PASS");
    expect(result.judgment).toBe("合格");
    expect(result.validation_error_count).toBe(0);
    expect(result.validation_warning_count).toBe(0);
    expect(result.failed_rules).toEqual([]);
    expect(result.passed_rules_count).toBe(12);
    expect(result.total_rules_applied).toBe(12);
    expect(result.validation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.extractable_for_billing).toBe(true);
    expect(result.validation_details).toBeDefined();
    expect(Array.isArray(result.validation_details)).toBe(true);
    expect(result.validation_details.length).toBe(12);

    result.validation_details.forEach((detail: any) => {
      expect(detail.rule_id).toBeDefined();
      expect(detail.field_name).toBeDefined();
      expect(detail.validation_result).toBe("pass");
      expect(detail.error_message).toBeUndefined();
    });
  });
});
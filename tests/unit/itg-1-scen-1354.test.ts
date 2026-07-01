import { defineValidationRule } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール定義機能", () => {
  // SCEN-1354: [normal] 営業データ品質検証ルール定義機能 - 営業データ各項目について許容範囲・データ型・必須フラグ・計算ロジックが正確に定義される
  test("営業データ項目の許容範囲・データ型・必須フラグ・計算ロジックが正確に定義され、ルール保存と検証が期待通りに実行される", () => {
    // ========== 売上金額ルール定義テスト ==========
    const sales_amount_rule_input = {
      data_item_id: "sales_amount_001",
      data_item_name: "売上金額",
      data_type: "number",
      is_required: true,
      min_value: 0,
      max_value: 10000000,
      calculation_logic: "SALES_AMOUNT = unit_price * quantity * (1 - discount_rate)"
    };

    const sales_amount_result = defineValidationRule(sales_amount_rule_input);

    expect(sales_amount_result).toEqual({
      rule_id: expect.any(String),
      data_item_id: "sales_amount_001",
      data_item_name: "売上金額",
      data_type: "number",
      is_required: true,
      min_value: 0,
      max_value: 10000000,
      calculation_logic: "SALES_AMOUNT = unit_price * quantity * (1 - discount_rate)",
      status: "定義済み",
      created_at: expect.any(String),
      validation_pattern: expect.any(String)
    });
    expect(sales_amount_result.status).toBe("定義済み");

    // ========== 顧客名ルール定義テスト ==========
    const customer_name_rule_input = {
      data_item_id: "customer_name_001",
      data_item_name: "顧客名",
      data_type: "string",
      is_required: true,
      min_length: 1,
      max_length: 100,
      calculation_logic: null
    };

    const customer_name_result = defineValidationRule(customer_name_rule_input);

    expect(customer_name_result).toEqual({
      rule_id: expect.any(String),
      data_item_id: "customer_name_001",
      data_item_name: "顧客名",
      data_type: "string",
      is_required: true,
      min_length: 1,
      max_length: 100,
      calculation_logic: null,
      status: "定義済み",
      created_at: expect.any(String),
      validation_pattern: expect.any(String)
    });
    expect(customer_name_result.status).toBe("定義済み");

    // ========== 契約日ルール定義テスト ==========
    const contract_date_rule_input = {
      data_item_id: "contract_date_001",
      data_item_name: "契約日",
      data_type: "date",
      is_required: true,
      date_format: "YYYY-MM-DD",
      calculation_logic: null
    };

    const contract_date_result = defineValidationRule(contract_date_rule_input);

    expect(contract_date_result).toEqual({
      rule_id: expect.any(String),
      data_item_id: "contract_date_001",
      data_item_name: "契約日",
      data_type: "date",
      is_required: true,
      date_format: "YYYY-MM-DD",
      calculation_logic: null,
      status: "定義済み",
      created_at: expect.any(String),
      validation_pattern: expect.any(String)
    });
    expect(contract_date_result.status).toBe("定義済み");

    // ========== アポ数ルール定義テスト（非必須項目） ==========
    const appointment_count_rule_input = {
      data_item_id: "appointment_count_001",
      data_item_name: "アポ数",
      data_type: "number",
      is_required: false,
      min_value: 0,
      max_value: 1000,
      calculation_logic: "APPOINTMENT_COUNT = COUNT(appointments WHERE status = 'confirmed')"
    };

    const appointment_count_result = defineValidationRule(appointment_count_rule_input);

    expect(appointment_count_result).toEqual({
      rule_id: expect.any(String),
      data_item_id: "appointment_count_001",
      data_item_name: "アポ数",
      data_type: "number",
      is_required: false,
      min_value: 0,
      max_value: 1000,
      calculation_logic: "APPOINTMENT_COUNT = COUNT(appointments WHERE status = 'confirmed')",
      status: "定義済み",
      created_at: expect.any(String),
      validation_pattern: expect.any(String)
    });
    expect(appointment_count_result.is_required).toBe(false);

    // ========== 成約数ルール定義テスト（計算ロジック含む） ==========
    const concluded_count_rule_input = {
      data_item_id: "concluded_count_001",
      data_item_name: "成約数",
      data_type: "number",
      is_required: true,
      min_value: 0,
      max_value: 500,
      calculation_logic: "CONCLUDED_COUNT = COUNT(deals WHERE status = 'closed_won' AND close_date >= start_of_month)"
    };

    const concluded_count_result = defineValidationRule(concluded_count_rule_input);

    expect(concluded_count_result).toEqual({
      rule_id: expect.any(String),
      data_item_id: "concluded_count_001",
      data_item_name: "成約数",
      data_type: "number",
      is_required: true,
      min_value: 0,
      max_value: 500,
      calculation_logic: "CONCLUDED_COUNT = COUNT(deals WHERE status = 'closed_won' AND close_date >= start_of_month)",
      status: "定義済み",
      created_at: expect.any(String),
      validation_pattern: expect.any(String)
    });
    expect(concluded_count_result.status).toBe("定義済み");

    // ========== 割引率ルール定義テスト（百分率） ==========
    const discount_rate_rule_input = {
      data_item_id: "discount_rate_001",
      data_item_name: "割引率",
      data_type: "number",
      is_required: false,
      min_value: 0,
      max_value: 100,
      calculation_logic: "DISCOUNT_RATE = (discount_amount / original_price) * 100"
    };

    const discount_rate_result = defineValidationRule(discount_rate_rule_input);

    expect(discount_rate_result).toEqual({
      rule_id: expect.any(String),
      data_item_id: "discount_rate_001",
      data_item_name: "割引率",
      data_type: "number",
      is_required: false,
      min_value: 0,
      max_value: 100,
      calculation_logic: "DISCOUNT_RATE = (discount_amount / original_price) * 100",
      status: "定義済み",
      created_at: expect.any(String),
      validation_pattern: expect.any(String)
    });
    expect(discount_rate_result.max_value).toBe(100);

    // ========== エラーテスト：データ型が無効 ==========
    const invalid_datatype_input = {
      data_item_id: "invalid_001",
      data_item_name: "テスト項目",
      data_type: "invalid_type",
      is_required: true
    };

    expect(() => defineValidationRule(invalid_datatype_input)).toThrow(/データ型/);

    // ========== エラーテスト：必須項目なのに最大値が未設定 ==========
    const missing_max_value_input = {
      data_item_id: "missing_001",
      data_item_name: "売上金額",
      data_type: "number",
      is_required: true,
      min_value: 0,
      max_value: undefined
    };

    expect(() => defineValidationRule(missing_max_value_input)).toThrow(/最大値/);

    // ========== エラーテスト：最小値が最大値を上回る ==========
    const invalid_range_input = {
      data_item_id: "invalid_range_001",
      data_item_name: "売上金額",
      data_type: "number",
      is_required: true,
      min_value: 10000000,
      max_value: 0
    };

    expect(() => defineValidationRule(invalid_range_input)).toThrow(/範囲/);
  });
});
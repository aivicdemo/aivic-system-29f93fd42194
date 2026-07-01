import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  executeValidationRuleOnDataInput,
  defineValidationRule,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1334
  test("定義された検証ルールが営業データ入力時に即座に実行され、ルール違反が検出される", () => {
    // 新規検証ルール「顧客名必須チェック」を定義
    const rule_customer_name = defineValidationRule({
      rule_id: "rule_001_customer_name_required",
      rule_name: "顧客名必須チェック",
      target_field: "customer_name",
      condition_type: "not_empty",
      condition_value: null,
      alert_level: "error",
      error_message: "顧客名は必須項目です",
      is_active: true,
    });

    expect(rule_customer_name).toEqual({
      rule_id: "rule_001_customer_name_required",
      rule_name: "顧客名必須チェック",
      target_field: "customer_name",
      condition_type: "not_empty",
      alert_level: "error",
      error_message: "顧客名は必須項目です",
      is_active: true,
    });

    // 営業データ入力時に検証ルール実行：顧客名が空の場合
    const input_data_empty_customer = {
      customer_name: "",
      contact_date: "2024-01-15",
      amount: 100000,
      status: "completed",
    };

    const validation_result_empty_customer = executeValidationRuleOnDataInput({
      input_data: input_data_empty_customer,
      rules: [rule_customer_name],
    });

    expect(validation_result_empty_customer).toEqual({
      is_valid: false,
      violations: [
        {
          rule_id: "rule_001_customer_name_required",
          rule_name: "顧客名必須チェック",
          target_field: "customer_name",
          alert_level: "error",
          error_message: "顧客名は必須項目です",
          input_value: "",
        },
      ],
    });

    // 顧客名が有効な場合は合格
    const input_data_valid_customer = {
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      amount: 100000,
      status: "completed",
    };

    const validation_result_valid_customer = executeValidationRuleOnDataInput({
      input_data: input_data_valid_customer,
      rules: [rule_customer_name],
    });

    expect(validation_result_valid_customer).toEqual({
      is_valid: true,
      violations: [],
    });

    // 異なるルール違反シナリオ：金額が負の値の場合
    const rule_amount_non_negative = defineValidationRule({
      rule_id: "rule_002_amount_non_negative",
      rule_name: "金額非負チェック",
      target_field: "amount",
      condition_type: "greater_than_or_equal",
      condition_value: 0,
      alert_level: "error",
      error_message: "金額は0以上である必要があります",
      is_active: true,
    });

    expect(rule_amount_non_negative).toEqual({
      rule_id: "rule_002_amount_non_negative",
      rule_name: "金額非負チェック",
      target_field: "amount",
      condition_type: "greater_than_or_equal",
      condition_value: 0,
      alert_level: "error",
      error_message: "金額は0以上である必要があります",
      is_active: true,
    });

    const input_data_negative_amount = {
      customer_name: "XYZ企業",
      contact_date: "2024-01-15",
      amount: -50000,
      status: "completed",
    };

    const validation_result_negative_amount = executeValidationRuleOnDataInput({
      input_data: input_data_negative_amount,
      rules: [rule_amount_non_negative],
    });

    expect(validation_result_negative_amount).toEqual({
      is_valid: false,
      violations: [
        {
          rule_id: "rule_002_amount_non_negative",
          rule_name: "金額非負チェック",
          target_field: "amount",
          alert_level: "error",
          error_message: "金額は0以上である必要があります",
          input_value: -50000,
        },
      ],
    });

    // 複数ルール並行実行：両方の違反が検出される
    const input_data_multiple_violations = {
      customer_name: "",
      contact_date: "2024-01-15",
      amount: -50000,
      status: "completed",
    };

    const validation_result_multiple_violations =
      executeValidationRuleOnDataInput({
        input_data: input_data_multiple_violations,
        rules: [rule_customer_name, rule_amount_non_negative],
      });

    expect(validation_result_multiple_violations).toEqual({
      is_valid: false,
      violations: [
        {
          rule_id: "rule_001_customer_name_required",
          rule_name: "顧客名必須チェック",
          target_field: "customer_name",
          alert_level: "error",
          error_message: "顧客名は必須項目です",
          input_value: "",
        },
        {
          rule_id: "rule_002_amount_non_negative",
          rule_name: "金額非負チェック",
          target_field: "amount",
          alert_level: "error",
          error_message: "金額は0以上である必要があります",
          input_value: -50000,
        },
      ],
    });

    // 複数ルール、すべて合格する場合
    const input_data_all_valid = {
      customer_name: "Valid Customer Inc",
      contact_date: "2024-01-15",
      amount: 250000,
      status: "completed",
    };

    const validation_result_all_valid = executeValidationRuleOnDataInput({
      input_data: input_data_all_valid,
      rules: [rule_customer_name, rule_amount_non_negative],
    });

    expect(validation_result_all_valid).toEqual({
      is_valid: true,
      violations: [],
    });

    // ルール無効化時は検証がスキップされることを確認
    const rule_customer_name_inactive = defineValidationRule({
      rule_id: "rule_001_customer_name_required",
      rule_name: "顧客名必須チェック",
      target_field: "customer_name",
      condition_type: "not_empty",
      condition_value: null,
      alert_level: "error",
      error_message: "顧客名は必須項目です",
      is_active: false,
    });

    const validation_result_inactive = executeValidationRuleOnDataInput({
      input_data: input_data_empty_customer,
      rules: [rule_customer_name_inactive],
    });

    expect(validation_result_inactive).toEqual({
      is_valid: true,
      violations: [],
    });
  });
});
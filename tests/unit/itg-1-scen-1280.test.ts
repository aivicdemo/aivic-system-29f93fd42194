import { describe, test, expect } from "@jest/globals";
import {
  extractBillingItems,
  validateBillingInfoAgainstContract,
  validateBillingInfoAgainstRule,
  validateBillingInfoAgainstHistory,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("請求対象項目の抽出・妥当性検証機能", () => {
  test("SCEN-1280: 抽出された請求情報が契約内容・顧客別請求ルール・過去の請求パターンと照合され、全て一致する", () => {
    // Setup: 複数の顧客と契約情報
    const customers = [
      {
        customer_id: "CUST001",
        customer_name: "顧客企業A",
        contract_id: "CON001",
        contract_status: "active",
      },
      {
        customer_id: "CUST002",
        customer_name: "顧客企業B",
        contract_id: "CON002",
        contract_status: "active",
      },
    ];

    // 各顧客に対する異なる請求ルール設定
    const billingRules = [
      {
        customer_id: "CUST001",
        billing_cycle: "monthly",
        billing_method: "invoice",
        discount_rate: 0.1,
        min_billing_amount: 10000,
        max_billing_amount: 500000,
      },
      {
        customer_id: "CUST002",
        billing_cycle: "quarterly",
        billing_method: "auto_debit",
        discount_rate: 0.05,
        min_billing_amount: 50000,
        max_billing_amount: 1000000,
      },
    ];

    // 過去の請求履歴データ（参照データ）
    const billingHistory = [
      {
        customer_id: "CUST001",
        billing_date: "2024-01-31",
        billing_amount: 150000,
        discount_amount: 15000,
        final_amount: 135000,
      },
      {
        customer_id: "CUST002",
        billing_date: "2024-01-31",
        billing_amount: 300000,
        discount_amount: 15000,
        final_amount: 285000,
      },
    ];

    // 営業データから抽出された請求対象項目
    const salesData = [
      {
        customer_id: "CUST001",
        sales_date: "2024-02-15",
        service_type: "basic_plan",
        appointment_count: 15,
        contract_count: 3,
        revenue_amount: 150000,
      },
      {
        customer_id: "CUST002",
        sales_date: "2024-02-15",
        service_type: "premium_plan",
        appointment_count: 25,
        contract_count: 5,
        revenue_amount: 300000,
      },
    ];

    // 請求対象項目の抽出実行
    const extracted_billing_items = extractBillingItems(salesData, customers);

    // 抽出結果の検証：顧客ごと、サービスごとに請求額が集計されていることを確認
    expect(extracted_billing_items).toEqual({
      items: [
        {
          customer_id: "CUST001",
          service_type: "basic_plan",
          base_amount: 150000,
          item_count: 3,
        },
        {
          customer_id: "CUST002",
          service_type: "premium_plan",
          base_amount: 300000,
          item_count: 5,
        },
      ],
      extraction_status: "success",
      error_count: 0,
    });

    // 契約内容との照合
    const contract_validation = validateBillingInfoAgainstContract(
      extracted_billing_items.items,
      customers
    );

    expect(contract_validation).toEqual({
      validation_status: "passed",
      matched_count: 2,
      mismatched_count: 0,
      errors: [],
    });

    // 顧客別請求ルールとの照合
    const rule_validation = validateBillingInfoAgainstRule(
      extracted_billing_items.items,
      billingRules
    );

    // CUST001: 150000 × (1 - 0.1) = 135000 ✓
    // CUST002: 300000 × (1 - 0.05) = 285000 ✓
    expect(rule_validation).toEqual({
      validation_status: "passed",
      rule_applied_count: 2,
      out_of_range_count: 0,
      calculated_amounts: [
        {
          customer_id: "CUST001",
          base_amount: 150000,
          discount_rate: 0.1,
          final_amount: 135000,
        },
        {
          customer_id: "CUST002",
          base_amount: 300000,
          discount_rate: 0.05,
          final_amount: 285000,
        },
      ],
      errors: [],
    });

    // 過去の請求パターンとの照合
    const history_validation = validateBillingInfoAgainstHistory(
      rule_validation.calculated_amounts,
      billingHistory
    );

    // CUST001: 前月 135000 ≈ 今月 135000 ✓
    // CUST002: 前月 285000 ≈ 今月 285000 ✓
    expect(history_validation).toEqual({
      validation_status: "passed",
      pattern_match_count: 2,
      pattern_deviation_count: 0,
      deviation_threshold_exceeded: false,
      comparison_results: [
        {
          customer_id: "CUST001",
          previous_amount: 135000,
          current_amount: 135000,
          variance_percent: 0,
          within_threshold: true,
        },
        {
          customer_id: "CUST002",
          previous_amount: 285000,
          current_amount: 285000,
          variance_percent: 0,
          within_threshold: true,
        },
      ],
      errors: [],
    });

    // 最終的な妥当性検証の確認：全照合が完了し、エラーが0件
    const total_validation_errors =
      contract_validation.mismatched_count +
      rule_validation.out_of_range_count +
      history_validation.pattern_deviation_count;

    expect(total_validation_errors).toBe(0);
    expect(contract_validation.validation_status).toBe("passed");
    expect(rule_validation.validation_status).toBe("passed");
    expect(history_validation.validation_status).toBe("passed");

    // 請求情報が正常な状態として標識されていることを確認
    expect(extracted_billing_items.extraction_status).toBe("success");
    expect(extracted_billing_items.error_count).toBe(0);
  });
});
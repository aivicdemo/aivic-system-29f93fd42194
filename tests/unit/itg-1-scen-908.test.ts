import { describe, test, expect } from "@jest/globals";
import { validateBillingAmountCalculationResult } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-908: [normal] 請求額計算結果検証機能 - 集計済み請求額が複数の検証観点を通過し、妥当性が確認される", () => {
    // テスト対象の請求額計算結果データを準備する（複数の売上レコードを含む）
    const billing_calculation_result = {
      billing_id: "BILL-2024-001",
      customer_id: "CUST-A001",
      billing_period_start: "2024-01-01",
      billing_period_end: "2024-01-31",
      sales_details: [
        {
          sales_id: "SALES-001",
          product_id: "PROD-001",
          sales_date: "2024-01-05",
          quantity: 10,
          unit_price: 1000.0,
          line_amount: 10000.0,
        },
        {
          sales_id: "SALES-002",
          product_id: "PROD-002",
          sales_date: "2024-01-15",
          quantity: 5,
          unit_price: 2000.0,
          line_amount: 10000.0,
        },
        {
          sales_id: "SALES-003",
          product_id: "PROD-001",
          sales_date: "2024-01-25",
          quantity: 8,
          unit_price: 1000.0,
          line_amount: 8000.0,
        },
      ],
      subtotal_before_discount: 28000.0,
      discount_rate: 0.1,
      discount_amount: 2800.0,
      subtotal_after_discount: 25200.0,
      tax_rate: 0.1,
      tax_amount: 2520.0,
      total_billing_amount: 27720.0,
      product_breakdowns: [
        {
          product_id: "PROD-001",
          product_amount: 18000.0,
          quantity_total: 18,
        },
        {
          product_id: "PROD-002",
          product_amount: 10000.0,
          quantity_total: 5,
        },
      ],
      adjustments: [
        {
          adjustment_type: "discount",
          adjustment_value: 2800.0,
        },
        {
          adjustment_type: "tax",
          adjustment_value: 2520.0,
        },
      ],
    };

    // 請求額計算機能を実行し、集計済み請求額を取得する
    const validation_result = validateBillingAmountCalculationResult(
      billing_calculation_result
    );

    // 金額の数値妥当性検証（負数チェック、上限値チェック）を実行する
    expect(validation_result.numerical_validity).toBe(true);
    expect(validation_result.numerical_validity_details.has_negative_values).toBe(
      false
    );
    expect(
      validation_result.numerical_validity_details.exceeds_maximum_limit
    ).toBe(false);
    expect(validation_result.numerical_validity_details.max_amount_checked).toBe(
      27720.0
    );

    // 金額の計算式検証（売上明細の合計値と集計結果の一致確認）を実行する
    expect(validation_result.formula_verification).toBe(true);
    expect(validation_result.formula_verification_details.sales_total).toBe(
      28000.0
    );
    expect(
      validation_result.formula_verification_details.calculated_subtotal
    ).toBe(28000.0);
    expect(
      validation_result.formula_verification_details.subtotal_matches
    ).toBe(true);

    // 金額の精度検証（小数点以下の丸め処理の正確性）を実行する
    expect(validation_result.precision_verification).toBe(true);
    expect(
      validation_result.precision_verification_details.decimal_places
    ).toBe(2);
    expect(
      validation_result.precision_verification_details.rounding_correct
    ).toBe(true);
    expect(
      validation_result.precision_verification_details.rounded_total
    ).toBe(27720.0);

    // 請求対象期間の検証（集計期間内のみの売上が含まれていることを確認）を実行する
    expect(validation_result.billing_period_verification).toBe(true);
    expect(
      validation_result.billing_period_verification_details.period_start
    ).toBe("2024-01-01");
    expect(
      validation_result.billing_period_verification_details.period_end
    ).toBe("2024-01-31");
    expect(
      validation_result.billing_period_verification_details.all_sales_within_period
    ).toBe(true);
    expect(
      validation_result.billing_period_verification_details.sales_count_in_period
    ).toBe(3);

    // 顧客別・商品別の請求額内訳検証を実行する
    expect(validation_result.breakdown_verification).toBe(true);
    expect(
      validation_result.breakdown_verification_details.product_breakdowns_valid
    ).toBe(true);
    expect(
      validation_result.breakdown_verification_details.breakdown_count
    ).toBe(2);
    expect(
      validation_result.breakdown_verification_details.breakdown_total
    ).toBe(28000.0);
    expect(
      validation_result.breakdown_verification_details.breakdown_matches_subtotal
    ).toBe(true);

    // 割引・税金などの調整項目が正しく適用されているか検証する
    expect(validation_result.adjustment_verification).toBe(true);
    expect(
      validation_result.adjustment_verification_details.discount_applied
    ).toBe(true);
    expect(
      validation_result.adjustment_verification_details.discount_calculated
    ).toBe(2800.0);
    expect(
      validation_result.adjustment_verification_details.discount_matches
    ).toBe(true);
    expect(
      validation_result.adjustment_verification_details.tax_applied
    ).toBe(true);
    expect(
      validation_result.adjustment_verification_details.tax_calculated
    ).toBe(2520.0);
    expect(
      validation_result.adjustment_verification_details.tax_matches
    ).toBe(true);
    expect(
      validation_result.adjustment_verification_details.final_amount_correct
    ).toBe(true);

    // すべての検証結果をアサーションで確認する
    expect(validation_result.overall_validation_passed).toBe(true);
    expect(validation_result.validation_status).toBe("PASSED");
    expect(validation_result.validation_timestamp).toBeDefined();
    expect(validation_result.error_messages).toHaveLength(0);
  });
});
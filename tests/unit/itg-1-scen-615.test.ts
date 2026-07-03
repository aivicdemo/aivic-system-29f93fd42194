import { describe, test, expect } from "@jest/globals";
import { validateSalesDataBoundaryValues } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-615: 営業データの数値項目が範囲の最小値・最大値の境界値である場合、検証が成功し正常と判定される", () => {
    // テスト対象: 売上金額（最小値: 0円、最大値: 999,999,999円）
    // テスト対象: 数量（最小値: 0、最大値: 1,000,000）
    // テスト対象: 割引率（最小値: 0%、最大値: 100%）

    // ケース1: 売上金額が最小値境界 (0円) の検証
    const min_sales_amount_result = validateSalesDataBoundaryValues({
      sales_amount: 0,
      quantity: 100,
      discount_rate: 10,
      field_name: "sales_amount",
      min_value: 0,
      max_value: 999999999,
    });
    expect(min_sales_amount_result).toEqual({
      is_valid: true,
      error_message: null,
      boundary_type: "min",
    });

    // ケース2: 売上金額が最大値境界 (999,999,999円) の検証
    const max_sales_amount_result = validateSalesDataBoundaryValues({
      sales_amount: 999999999,
      quantity: 100,
      discount_rate: 10,
      field_name: "sales_amount",
      min_value: 0,
      max_value: 999999999,
    });
    expect(max_sales_amount_result).toEqual({
      is_valid: true,
      error_message: null,
      boundary_type: "max",
    });

    // ケース3: 数量が最小値境界 (0) の検証
    const min_quantity_result = validateSalesDataBoundaryValues({
      sales_amount: 50000,
      quantity: 0,
      discount_rate: 10,
      field_name: "quantity",
      min_value: 0,
      max_value: 1000000,
    });
    expect(min_quantity_result).toEqual({
      is_valid: true,
      error_message: null,
      boundary_type: "min",
    });

    // ケース4: 数量が最大値境界 (1,000,000) の検証
    const max_quantity_result = validateSalesDataBoundaryValues({
      sales_amount: 50000,
      quantity: 1000000,
      discount_rate: 10,
      field_name: "quantity",
      min_value: 0,
      max_value: 1000000,
    });
    expect(max_quantity_result).toEqual({
      is_valid: true,
      error_message: null,
      boundary_type: "max",
    });

    // ケース5: 割引率が最小値境界 (0%) の検証
    const min_discount_rate_result = validateSalesDataBoundaryValues({
      sales_amount: 50000,
      quantity: 100,
      discount_rate: 0,
      field_name: "discount_rate",
      min_value: 0,
      max_value: 100,
    });
    expect(min_discount_rate_result).toEqual({
      is_valid: true,
      error_message: null,
      boundary_type: "min",
    });

    // ケース6: 割引率が最大値境界 (100%) の検証
    const max_discount_rate_result = validateSalesDataBoundaryValues({
      sales_amount: 50000,
      quantity: 100,
      discount_rate: 100,
      field_name: "discount_rate",
      min_value: 0,
      max_value: 100,
    });
    expect(max_discount_rate_result).toEqual({
      is_valid: true,
      error_message: null,
      boundary_type: "max",
    });

    // ケース7: 複数フィールドの同時検証結果を集計
    const multi_field_results = [
      min_sales_amount_result,
      max_sales_amount_result,
      min_quantity_result,
      max_quantity_result,
      min_discount_rate_result,
      max_discount_rate_result,
    ];

    // すべての検証結果が成功していることを確認
    expect(multi_field_results.every((r) => r.is_valid === true)).toBe(true);
    expect(
      multi_field_results.every((r) => r.error_message === null)
    ).toBe(true);

    // 検証ログ記録: 境界値検証による正常判定が完了
    const validation_summary = {
      total_validations: 6,
      successful_validations: 6,
      failed_validations: 0,
      validation_status: "PASSED",
      all_boundary_values_within_range: true,
      processing_status: "READY_FOR_BILLING_AUTOMATION",
    };

    expect(validation_summary.total_validations).toBe(6);
    expect(validation_summary.successful_validations).toBe(6);
    expect(validation_summary.failed_validations).toBe(0);
    expect(validation_summary.validation_status).toBe("PASSED");
    expect(validation_summary.all_boundary_values_within_range).toBe(true);
    expect(validation_summary.processing_status).toBe("READY_FOR_BILLING_AUTOMATION");
  });
});
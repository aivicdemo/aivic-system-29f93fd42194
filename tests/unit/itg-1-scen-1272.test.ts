import { describe, test, expect } from "@jest/globals";
import { validateSalesDataBoundaryValues } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  test("SCEN-1272: 月次営業データ完全性・正確性の自動検証 - 営業データの値が定義された範囲の境界値である場合、正常と判定される", () => {
    // テストデータセット：営業データの各フィールドに定義された範囲の最小値と最大値を設定
    const test_data_min_sales_revenue = {
      sales_revenue_yen: 0,
      order_count: 0,
      customer_count: 0,
      unit_price_yen: 0,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    const test_data_max_sales_revenue = {
      sales_revenue_yen: 10000000,
      order_count: 1000,
      customer_count: 500,
      unit_price_yen: 500000,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    const test_data_min_order_count = {
      sales_revenue_yen: 500000,
      order_count: 0,
      customer_count: 5,
      unit_price_yen: 100000,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    const test_data_max_order_count = {
      sales_revenue_yen: 500000,
      order_count: 1000,
      customer_count: 5,
      unit_price_yen: 100000,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    const test_data_min_customer_count = {
      sales_revenue_yen: 500000,
      order_count: 10,
      customer_count: 0,
      unit_price_yen: 100000,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    const test_data_max_customer_count = {
      sales_revenue_yen: 500000,
      order_count: 10,
      customer_count: 500,
      unit_price_yen: 100000,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    const test_data_min_unit_price = {
      sales_revenue_yen: 500000,
      order_count: 10,
      customer_count: 5,
      unit_price_yen: 0,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    const test_data_max_unit_price = {
      sales_revenue_yen: 500000,
      order_count: 10,
      customer_count: 5,
      unit_price_yen: 500000,
      validated_at: new Date("2024-01-15T09:00:00Z"),
    };

    // 月次営業データ完全性・正確性の自動検証機能を実行
    const validation_result_min_sales = validateSalesDataBoundaryValues(
      test_data_min_sales_revenue
    );
    const validation_result_max_sales = validateSalesDataBoundaryValues(
      test_data_max_sales_revenue
    );
    const validation_result_min_order = validateSalesDataBoundaryValues(
      test_data_min_order_count
    );
    const validation_result_max_order = validateSalesDataBoundaryValues(
      test_data_max_order_count
    );
    const validation_result_min_customer = validateSalesDataBoundaryValues(
      test_data_min_customer_count
    );
    const validation_result_max_customer = validateSalesDataBoundaryValues(
      test_data_max_customer_count
    );
    const validation_result_min_price = validateSalesDataBoundaryValues(
      test_data_min_unit_price
    );
    const validation_result_max_price = validateSalesDataBoundaryValues(
      test_data_max_unit_price
    );

    // 売上金額が範囲の最小値（下限境界値）であるレコードの検証結果を確認
    expect(validation_result_min_sales.validation_status).toBe("normal");
    expect(validation_result_min_sales.has_error_flag).toBe(false);
    expect(validation_result_min_sales.quality_standard_met).toBe(true);

    // 売上金額が範囲の最大値（上限境界値）であるレコードの検証結果を確認
    expect(validation_result_max_sales.validation_status).toBe("normal");
    expect(validation_result_max_sales.has_error_flag).toBe(false);
    expect(validation_result_max_sales.quality_standard_met).toBe(true);

    // 受注数が範囲の最小値（下限境界値）であるレコードの検証結果を確認
    expect(validation_result_min_order.validation_status).toBe("normal");
    expect(validation_result_min_order.has_error_flag).toBe(false);
    expect(validation_result_min_order.quality_standard_met).toBe(true);

    // 受注数が範囲の最大値（上限境界値）であるレコードの検証結果を確認
    expect(validation_result_max_order.validation_status).toBe("normal");
    expect(validation_result_max_order.has_error_flag).toBe(false);
    expect(validation_result_max_order.quality_standard_met).toBe(true);

    // 顧客数が範囲の最小値（下限境界値）であるレコードの検証結果を確認
    expect(validation_result_min_customer.validation_status).toBe("normal");
    expect(validation_result_min_customer.has_error_flag).toBe(false);
    expect(validation_result_min_customer.quality_standard_met).toBe(true);

    // 顧客数が範囲の最大値（上限境界値）であるレコードの検証結果を確認
    expect(validation_result_max_customer.validation_status).toBe("normal");
    expect(validation_result_max_customer.has_error_flag).toBe(false);
    expect(validation_result_max_customer.quality_standard_met).toBe(true);

    // 単価が範囲の最小値（下限境界値）であるレコードの検証結果を確認
    expect(validation_result_min_price.validation_status).toBe("normal");
    expect(validation_result_min_price.has_error_flag).toBe(false);
    expect(validation_result_min_price.quality_standard_met).toBe(true);

    // 単価が範囲の最大値（上限境界値）であるレコードの検証結果を確認
    expect(validation_result_max_price.validation_status).toBe("normal");
    expect(validation_result_max_price.has_error_flag).toBe(false);
    expect(validation_result_max_price.quality_standard_met).toBe(true);

    // 検証ログまたはレポートで全ての境界値テストの判定結果を確認
    expect([
      validation_result_min_sales.validation_status,
      validation_result_max_sales.validation_status,
      validation_result_min_order.validation_status,
      validation_result_max_order.validation_status,
      validation_result_min_customer.validation_status,
      validation_result_max_customer.validation_status,
      validation_result_min_price.validation_status,
      validation_result_max_price.validation_status,
    ]).toEqual([
      "normal",
      "normal",
      "normal",
      "normal",
      "normal",
      "normal",
      "normal",
      "normal",
    ]);

    expect([
      validation_result_min_sales.has_error_flag,
      validation_result_max_sales.has_error_flag,
      validation_result_min_order.has_error_flag,
      validation_result_max_order.has_error_flag,
      validation_result_min_customer.has_error_flag,
      validation_result_max_customer.has_error_flag,
      validation_result_min_price.has_error_flag,
      validation_result_max_price.has_error_flag,
    ]).toEqual([false, false, false, false, false, false, false, false]);

    expect([
      validation_result_min_sales.quality_standard_met,
      validation_result_max_sales.quality_standard_met,
      validation_result_min_order.quality_standard_met,
      validation_result_max_order.quality_standard_met,
      validation_result_min_customer.quality_standard_met,
      validation_result_max_customer.quality_standard_met,
      validation_result_min_price.quality_standard_met,
      validation_result_max_price.quality_standard_met,
    ]).toEqual([true, true, true, true, true, true, true, true]);
  });
});
import { describe, test, expect } from "@jest/globals";
import { validateSalesDataAmountBoundary } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-1099: 月次営業データ集計・検証機能 - 金額妥当性の境界値判定で正常範囲ギリギリのデータが許可される", () => {
    // 下限値（0円）のデータ検証 - 正常範囲として許可されるべき
    const lower_boundary_result = validateSalesDataAmountBoundary({
      amount: 0,
      min_amount: 0,
      max_amount: 999999999,
    });
    expect(lower_boundary_result).toEqual({
      is_valid: true,
      error_count: 0,
      validation_errors: [],
    });

    // 上限値（999,999,999円）のデータ検証 - 正常範囲として許可されるべき
    const upper_boundary_result = validateSalesDataAmountBoundary({
      amount: 999999999,
      min_amount: 0,
      max_amount: 999999999,
    });
    expect(upper_boundary_result).toEqual({
      is_valid: true,
      error_count: 0,
      validation_errors: [],
    });

    // 下限値-1（負数）のデータ検証 - エラーが発生するべき
    const below_lower_result = validateSalesDataAmountBoundary({
      amount: -1,
      min_amount: 0,
      max_amount: 999999999,
    });
    expect(below_lower_result.is_valid).toBe(false);
    expect(below_lower_result.error_count).toBe(1);
    expect(below_lower_result.validation_errors.length).toBe(1);
    expect(below_lower_result.validation_errors[0]).toMatch(/金額/);

    // 上限値+1のデータ検証 - エラーが発生するべき
    const above_upper_result = validateSalesDataAmountBoundary({
      amount: 1000000000,
      min_amount: 0,
      max_amount: 999999999,
    });
    expect(above_upper_result.is_valid).toBe(false);
    expect(above_upper_result.error_count).toBe(1);
    expect(above_upper_result.validation_errors.length).toBe(1);
    expect(above_upper_result.validation_errors[0]).toMatch(/金額/);

    // バッチ検証実行 - 下限値と上限値を含むレコードセット
    const batch_validation_result = validateSalesDataAmountBoundary({
      records: [
        { amount: 0, min_amount: 0, max_amount: 999999999 },
        { amount: 500000000, min_amount: 0, max_amount: 999999999 },
        { amount: 999999999, min_amount: 0, max_amount: 999999999 },
        { amount: -1, min_amount: 0, max_amount: 999999999 },
        { amount: 1000000000, min_amount: 0, max_amount: 999999999 },
      ],
      batch_mode: true,
    });
    expect(batch_validation_result.is_valid).toBe(false);
    expect(batch_validation_result.error_count).toBe(2);
    expect(batch_validation_result.valid_records_count).toBe(3);
    expect(batch_validation_result.excluded_from_aggregation_count).toBe(2);
    expect(batch_validation_result.validation_errors.length).toBeGreaterThan(0);
    expect(batch_validation_result.validation_errors.some((err) => /金額/.test(err))).toBe(
      true
    );
  });
});
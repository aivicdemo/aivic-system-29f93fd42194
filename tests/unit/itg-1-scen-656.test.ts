import { validateReportGenerationParameters } from "../../src/logic/it-1-2-1";

describe("レポート生成パラメータ妥当性検証機能", () => {
  // SCEN-656: [error] レポート生成パラメータ妥当性検証機能 - 設定パラメータが営業データの範囲外の場合、不整合エラーが検出される
  test("設定パラメータが営業データの範囲外の場合、不整合エラーが検出される", () => {
    // 営業データの有効範囲を定義（例：売上範囲、日付範囲、地域コード等）
    const valid_sales_min = 0;
    const valid_sales_max = 1000000;
    const valid_date_start = new Date("2024-01-01T00:00:00Z");
    const valid_date_end = new Date("2024-12-31T23:59:59Z");
    const valid_region_codes = ["JP_01", "JP_02", "JP_03"];

    // ハッピーパス：パラメータが有効範囲内の場合は検証成功
    const valid_params = {
      sales_min: 10000,
      sales_max: 500000,
      period_start: new Date("2024-03-01T00:00:00Z"),
      period_end: new Date("2024-03-31T23:59:59Z"),
      region_code: "JP_01",
    };

    const valid_result = validateReportGenerationParameters(valid_params, {
      sales_min: valid_sales_min,
      sales_max: valid_sales_max,
      date_start: valid_date_start,
      date_end: valid_date_end,
      region_codes: valid_region_codes,
    });

    expect(valid_result.is_valid).toBe(true);
    expect(valid_result.errors).toEqual([]);

    // エラーケース 1: 売上の下限が範囲外（負の値）
    const invalid_sales_min_params = {
      sales_min: -10000,
      sales_max: 500000,
      period_start: new Date("2024-03-01T00:00:00Z"),
      period_end: new Date("2024-03-31T23:59:59Z"),
      region_code: "JP_01",
    };

    expect(() =>
      validateReportGenerationParameters(invalid_sales_min_params, {
        sales_min: valid_sales_min,
        sales_max: valid_sales_max,
        date_start: valid_date_start,
        date_end: valid_date_end,
        region_codes: valid_region_codes,
      })
    ).toThrow(/売上/);

    // エラーケース 2: 売上の上限が範囲外（最大値を超過）
    const invalid_sales_max_params = {
      sales_min: 10000,
      sales_max: 2000000,
      period_start: new Date("2024-03-01T00:00:00Z"),
      period_end: new Date("2024-03-31T23:59:59Z"),
      region_code: "JP_01",
    };

    expect(() =>
      validateReportGenerationParameters(invalid_sales_max_params, {
        sales_min: valid_sales_min,
        sales_max: valid_sales_max,
        date_start: valid_date_start,
        date_end: valid_date_end,
        region_codes: valid_region_codes,
      })
    ).toThrow(/売上/);

    // エラーケース 3: 日付範囲が無効（開始日が終了日より後）
    const invalid_date_params = {
      sales_min: 10000,
      sales_max: 500000,
      period_start: new Date("2024-03-31T00:00:00Z"),
      period_end: new Date("2024-03-01T23:59:59Z"),
      region_code: "JP_01",
    };

    expect(() =>
      validateReportGenerationParameters(invalid_date_params, {
        sales_min: valid_sales_min,
        sales_max: valid_sales_max,
        date_start: valid_date_start,
        date_end: valid_date_end,
        region_codes: valid_region_codes,
      })
    ).toThrow(/日付/);

    // エラーケース 4: 日付範囲が有効範囲外（営業データの期間外）
    const out_of_range_date_params = {
      sales_min: 10000,
      sales_max: 500000,
      period_start: new Date("2025-01-01T00:00:00Z"),
      period_end: new Date("2025-01-31T23:59:59Z"),
      region_code: "JP_01",
    };

    expect(() =>
      validateReportGenerationParameters(out_of_range_date_params, {
        sales_min: valid_sales_min,
        sales_max: valid_sales_max,
        date_start: valid_date_start,
        date_end: valid_date_end,
        region_codes: valid_region_codes,
      })
    ).toThrow(/日付/);

    // エラーケース 5: 地域コードが存在しない場合
    const invalid_region_params = {
      sales_min: 10000,
      sales_max: 500000,
      period_start: new Date("2024-03-01T00:00:00Z"),
      period_end: new Date("2024-03-31T23:59:59Z"),
      region_code: "JP_99",
    };

    expect(() =>
      validateReportGenerationParameters(invalid_region_params, {
        sales_min: valid_sales_min,
        sales_max: valid_sales_max,
        date_start: valid_date_start,
        date_end: valid_date_end,
        region_codes: valid_region_codes,
      })
    ).toThrow(/地域/);

    // エラーケース 6: 複数のパラメータが同時に無効な場合
    const multiple_invalid_params = {
      sales_min: -50000,
      sales_max: 2500000,
      period_start: new Date("2025-06-01T00:00:00Z"),
      period_end: new Date("2025-06-30T23:59:59Z"),
      region_code: "JP_88",
    };

    const multiple_errors_result = validateReportGenerationParameters(
      multiple_invalid_params,
      {
        sales_min: valid_sales_min,
        sales_max: valid_sales_max,
        date_start: valid_date_start,
        date_end: valid_date_end,
        region_codes: valid_region_codes,
      }
    );

    expect(multiple_errors_result.is_valid).toBe(false);
    expect(multiple_errors_result.errors.length).toBeGreaterThan(0);
    expect(
      multiple_errors_result.errors.some((err: any) => err.parameter)
    ).toBe(true);
    expect(multiple_errors_result.errors[0]).toHaveProperty("reason");
  });
});
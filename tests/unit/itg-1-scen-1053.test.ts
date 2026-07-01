import { validateSalesDataNumericRange } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ入力時の品質検証 - 数値型フィールドの範囲検証", () => {
  // SCEN-1053: [edge] 営業データ入力時の品質検証 - データ型が数値のとき指定範囲の最大値・最小値が正確に検証される
  test("数値型フィールドで指定範囲の最小値・最大値が正確に検証される", () => {
    // ハッピーパス: 最小値での受理
    const result_min_valid = validateSalesDataNumericRange({
      fieldName: "売上金額",
      value: 10000,
      minValue: 10000,
      maxValue: 1000000,
    });
    expect(result_min_valid.isValid).toBe(true);
    expect(result_min_valid.errorMessage).toBe("");

    // 最小値-1の拒否
    const result_below_min = validateSalesDataNumericRange({
      fieldName: "売上金額",
      value: 9999,
      minValue: 10000,
      maxValue: 1000000,
    });
    expect(result_below_min.isValid).toBe(false);
    expect(result_below_min.errorMessage).toMatch(/売上金額/);

    // ハッピーパス: 最大値での受理
    const result_max_valid = validateSalesDataNumericRange({
      fieldName: "売上金額",
      value: 1000000,
      minValue: 10000,
      maxValue: 1000000,
    });
    expect(result_max_valid.isValid).toBe(true);
    expect(result_max_valid.errorMessage).toBe("");

    // 最大値+1の拒否
    const result_above_max = validateSalesDataNumericRange({
      fieldName: "売上金額",
      value: 1000001,
      minValue: 10000,
      maxValue: 1000000,
    });
    expect(result_above_max.isValid).toBe(false);
    expect(result_above_max.errorMessage).toMatch(/売上金額/);

    // 複数フィールドの検証: 数量フィールド
    const result_quantity_min = validateSalesDataNumericRange({
      fieldName: "数量",
      value: 1,
      minValue: 1,
      maxValue: 999,
    });
    expect(result_quantity_min.isValid).toBe(true);
    expect(result_quantity_min.errorMessage).toBe("");

    const result_quantity_below_min = validateSalesDataNumericRange({
      fieldName: "数量",
      value: 0,
      minValue: 1,
      maxValue: 999,
    });
    expect(result_quantity_below_min.isValid).toBe(false);
    expect(result_quantity_below_min.errorMessage).toMatch(/数量/);

    const result_quantity_max = validateSalesDataNumericRange({
      fieldName: "数量",
      value: 999,
      minValue: 1,
      maxValue: 999,
    });
    expect(result_quantity_max.isValid).toBe(true);
    expect(result_quantity_max.errorMessage).toBe("");

    const result_quantity_above_max = validateSalesDataNumericRange({
      fieldName: "数量",
      value: 1000,
      minValue: 1,
      maxValue: 999,
    });
    expect(result_quantity_above_max.isValid).toBe(false);
    expect(result_quantity_above_max.errorMessage).toMatch(/数量/);

    // 複数フィールドの検証: 割引率フィールド
    const result_discount_min = validateSalesDataNumericRange({
      fieldName: "割引率",
      value: 0,
      minValue: 0,
      maxValue: 100,
    });
    expect(result_discount_min.isValid).toBe(true);
    expect(result_discount_min.errorMessage).toBe("");

    const result_discount_below_min = validateSalesDataNumericRange({
      fieldName: "割引率",
      value: -1,
      minValue: 0,
      maxValue: 100,
    });
    expect(result_discount_below_min.isValid).toBe(false);
    expect(result_discount_below_min.errorMessage).toMatch(/割引率/);

    const result_discount_max = validateSalesDataNumericRange({
      fieldName: "割引率",
      value: 100,
      minValue: 0,
      maxValue: 100,
    });
    expect(result_discount_max.isValid).toBe(true);
    expect(result_discount_max.errorMessage).toBe("");

    const result_discount_above_max = validateSalesDataNumericRange({
      fieldName: "割引率",
      value: 101,
      minValue: 0,
      maxValue: 100,
    });
    expect(result_discount_above_max.isValid).toBe(false);
    expect(result_discount_above_max.errorMessage).toMatch(/割引率/);
  });
});
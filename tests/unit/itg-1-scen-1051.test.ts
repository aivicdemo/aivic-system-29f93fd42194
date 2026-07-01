import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ入力時の品質検証", () => {
  // SCEN-1051
  test("必須項目がすべて入力され、データ型と値の範囲が妥当のとき検証が成功する", () => {
    const input_sales_activity_data = {
      sales_staff_name: "山田太郎",
      customer_name: "ABC株式会社",
      revenue_amount: 150000,
      revenue_date: "2024-01-15",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_sales_activity_data);

    expect(result.is_valid).toBe(true);
    expect(result.validation_errors).toEqual([]);
    expect(result.status).toBe("success");
  });

  // エラーケース: 必須項目の欠落 - 営業担当者名なし
  test("必須項目（営業担当者名）が欠落している場合、検証エラーを返す", () => {
    const input_incomplete_data = {
      customer_name: "ABC株式会社",
      revenue_amount: 150000,
      revenue_date: "2024-01-15",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_incomplete_data);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors.length).toBeGreaterThan(0);
    expect(result.validation_errors[0]).toMatch(/営業担当者名/);
  });

  // エラーケース: データ型の不整合 - 売上金額が文字列
  test("売上金額が数値型でない場合、検証エラーを返す", () => {
    const input_invalid_type = {
      sales_staff_name: "山田太郎",
      customer_name: "ABC株式会社",
      revenue_amount: "150000",
      revenue_date: "2024-01-15",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_invalid_type);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors.length).toBeGreaterThan(0);
    expect(result.validation_errors[0]).toMatch(/金額|データ型/);
  });

  // エラーケース: 値の範囲外 - 売上金額が0以下
  test("売上金額が0以下の場合、検証エラーを返す", () => {
    const input_out_of_range = {
      sales_staff_name: "山田太郎",
      customer_name: "ABC株式会社",
      revenue_amount: 0,
      revenue_date: "2024-01-15",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_out_of_range);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors.length).toBeGreaterThan(0);
    expect(result.validation_errors[0]).toMatch(/金額|範囲/);
  });

  // エラーケース: 日付形式が不正
  test("売上日付が妥当な日付形式でない場合、検証エラーを返す", () => {
    const input_invalid_date = {
      sales_staff_name: "山田太郎",
      customer_name: "ABC株式会社",
      revenue_amount: 150000,
      revenue_date: "2024/01/15",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_invalid_date);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors.length).toBeGreaterThan(0);
    expect(result.validation_errors[0]).toMatch(/日付|形式/);
  });

  // エラーケース: 複数の項目に不備がある場合
  test("複数の項目に不備がある場合、すべての検証エラーを返す", () => {
    const input_multiple_errors = {
      sales_staff_name: "",
      customer_name: "ABC株式会社",
      revenue_amount: -50000,
      revenue_date: "invalid-date",
      product_name: "",
    };

    const result = validateSalesActivityData(input_multiple_errors);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors.length).toBeGreaterThanOrEqual(3);
  });

  // 境界値テスト: 売上金額が最小正数
  test("売上金額が1（最小正数）の場合、検証が成功する", () => {
    const input_minimum_valid = {
      sales_staff_name: "山田太郎",
      customer_name: "ABC株式会社",
      revenue_amount: 1,
      revenue_date: "2024-01-15",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_minimum_valid);

    expect(result.is_valid).toBe(true);
    expect(result.validation_errors).toEqual([]);
  });

  // 正常系: 売上金額が大きな値
  test("売上金額が大きな値の場合、検証が成功する", () => {
    const input_large_amount = {
      sales_staff_name: "山田太郎",
      customer_name: "ABC株式会社",
      revenue_amount: 10000000,
      revenue_date: "2024-01-15",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_large_amount);

    expect(result.is_valid).toBe(true);
    expect(result.validation_errors).toEqual([]);
  });

  // 正常系: 最新の日付で検証
  test("現在日付を含む妥当な日付で検証が成功する", () => {
    const input_current_date = {
      sales_staff_name: "山田太郎",
      customer_name: "ABC株式会社",
      revenue_amount: 150000,
      revenue_date: "2024-12-31",
      product_name: "営業支援ツール",
    };

    const result = validateSalesActivityData(input_current_date);

    expect(result.is_valid).toBe(true);
    expect(result.validation_errors).toEqual([]);
  });
});
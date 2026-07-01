import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-1130: [normal] 営業データ品質検証 - 必須項目が全て揃っていて、データ型と値の範囲が正常な営業データが検証を通過する
  test("必須項目が全て揃っており、データ型と値の範囲が正常な営業データが検証を通過する", () => {
    const valid_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 12345,
      sales_amount: 50000,
      transaction_date: "2024-01-15",
      product_code: "PROD-A001"
    };

    const result = validateSalesData(valid_sales_data);

    // 検証が成功し、valid: true が返される
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    // データ型の検証
    expect(typeof result.validated_staff_id).toBe("string");
    expect(typeof result.validated_customer_id).toBe("number");
    expect(typeof result.validated_sales_amount).toBe("number");
    expect(result.validated_transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof result.validated_product_code).toBe("string");

    // 値の範囲検証
    expect(result.validated_customer_id).toBeGreaterThan(0);
    expect(result.validated_sales_amount).toBeGreaterThan(0);
    expect(result.validated_sales_amount).toBeLessThanOrEqual(999999999);

    // 取引日が過去1年以内であることを確認
    const transaction_date = new Date(result.validated_transaction_date);
    const reference_date = new Date("2024-01-15");
    const one_year_ago = new Date(reference_date);
    one_year_ago.setFullYear(one_year_ago.getFullYear() - 1);
    expect(transaction_date.getTime()).toBeGreaterThanOrEqual(one_year_ago.getTime());
    expect(transaction_date.getTime()).toBeLessThanOrEqual(reference_date.getTime());

    // 商品コードが有効な登録済みコードであることを確認
    expect(["PROD-A001", "PROD-A002", "PROD-B001", "PROD-B002"]).toContain(
      result.validated_product_code
    );
  });

  test("必須項目の営業担当者IDが欠落している場合はエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "",
      customer_id: 12345,
      sales_amount: 50000,
      transaction_date: "2024-01-15",
      product_code: "PROD-A001"
    };

    expect(() => validateSalesData(invalid_sales_data)).toThrow(/営業担当者ID/);
  });

  test("顧客IDがnullまたは未定義の場合はエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: null,
      sales_amount: 50000,
      transaction_date: "2024-01-15",
      product_code: "PROD-A001"
    };

    expect(() => validateSalesData(invalid_sales_data as any)).toThrow(/顧客ID/);
  });

  test("売上金額がゼロ以下の場合はエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 12345,
      sales_amount: 0,
      transaction_date: "2024-01-15",
      product_code: "PROD-A001"
    };

    expect(() => validateSalesData(invalid_sales_data)).toThrow(/売上金額/);
  });

  test("売上金額が許容範囲を超えた場合はエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 12345,
      sales_amount: 1000000000,
      transaction_date: "2024-01-15",
      product_code: "PROD-A001"
    };

    expect(() => validateSalesData(invalid_sales_data)).toThrow(/売上金額/);
  });

  test("取引日が過去1年以上前の場合はエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 12345,
      sales_amount: 50000,
      transaction_date: "2022-01-15",
      transaction_reference_date: new Date("2024-01-15"),
      product_code: "PROD-A001"
    };

    expect(() => validateSalesData(invalid_sales_data as any)).toThrow(/取引日/);
  });

  test("商品コードが登録されていない場合はエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 12345,
      sales_amount: 50000,
      transaction_date: "2024-01-15",
      product_code: "PROD-INVALID"
    };

    expect(() => validateSalesData(invalid_sales_data)).toThrow(/商品コード/);
  });

  test("取引日がデータ型で文字列でない場合はエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 12345,
      sales_amount: 50000,
      transaction_date: 20240115,
      product_code: "PROD-A001"
    };

    expect(() => validateSalesData(invalid_sales_data as any)).toThrow(/取引日/);
  });

  test("複数の必須項目が欠落している場合は、最初に検出されたエラーが返される", () => {
    const invalid_sales_data = {
      sales_staff_id: "",
      customer_id: null,
      sales_amount: -1000,
      transaction_date: "",
      product_code: ""
    };

    expect(() => validateSalesData(invalid_sales_data as any)).toThrow(
      /営業担当者ID|顧客ID|売上金額|取引日|商品コード/
    );
  });

  test("境界値: 売上金額が最小有効値である場合は検証を通過する", () => {
    const boundary_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 1,
      sales_amount: 1,
      transaction_date: "2024-01-15",
      product_code: "PROD-A001"
    };

    const result = validateSalesData(boundary_sales_data);

    expect(result.valid).toBe(true);
    expect(result.validated_sales_amount).toBe(1);
  });

  test("境界値: 売上金額が最大有効値である場合は検証を通過する", () => {
    const boundary_sales_data = {
      sales_staff_id: "STAFF001",
      customer_id: 99999,
      sales_amount: 999999999,
      transaction_date: "2024-01-15",
      product_code: "PROD-B002"
    };

    const result = validateSalesData(boundary_sales_data);

    expect(result.valid).toBe(true);
    expect(result.validated_sales_amount).toBe(999999999);
  });
});
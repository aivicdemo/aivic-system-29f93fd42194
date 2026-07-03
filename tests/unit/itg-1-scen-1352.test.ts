import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-1352
  test("すべての必須項目が入力されている場合、完全性チェックに合格する", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Pass");
    expect(result.errors).toEqual([]);
    expect(result.is_complete).toBe(true);
  });

  test("必須項目『顧客名』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: "customer_name",
      })
    );
  });

  test("必須項目『取引金額』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: null,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("必須項目『取引日』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
  });

  test("必須項目『営業担当者』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
  });

  test("必須項目『商品コード』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
  });

  test("必須項目『数量』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: null,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
  });

  test("必須項目『納期』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
  });

  test("必須項目『請求先』が欠落している場合、完全性チェックに不合格となる", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
  });

  test("複数の必須項目が欠落している場合、すべての欠落項目がエラーリストに含まれる", () => {
    const salesData = {
      customer_name: "",
      transaction_amount: null,
      transaction_date: "2024-01-15",
      sales_person: "",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Fail");
    expect(result.is_complete).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  test("取引金額がゼロの場合、値としては入力されているため完全性チェックに合格する", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 0,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 5,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Pass");
    expect(result.is_complete).toBe(true);
  });

  test("数量がゼロの場合、値としては入力されているため完全性チェックに合格する", () => {
    const salesData = {
      customer_name: "顧客A",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      sales_person: "営業担当者B",
      product_code: "PROD001",
      quantity: 0,
      delivery_date: "2024-02-15",
      billing_address: "東京都渋谷区",
    };

    const result = validateSalesDataCompleteness(salesData);

    expect(result.status).toBe("Pass");
    expect(result.is_complete).toBe(true);
  });
});
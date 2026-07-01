import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・異常検出", () => {
  // SCEN-602
  test("必須項目が全て入力され、データ型と値の範囲が正常な営業データが検証を通過する", () => {
    const sales_data = {
      customer_id: "CUST001",
      product_id: "PROD002",
      amount: 50000,
      transaction_datetime: "2024-01-15T09:30:00Z",
      sales_rep_id: "REP001",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("合格");
    expect(result.is_valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.error_count).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  test("必須項目が欠落している場合、検証が不合格になる", () => {
    const sales_data_missing = {
      customer_id: "CUST001",
      product_id: "PROD002",
      amount: 50000,
      transaction_datetime: "2024-01-15T09:30:00Z",
    };

    expect(() => validateSalesData(sales_data_missing)).toThrow(/営業担当者ID/);
  });

  test("金額がゼロ以下の場合、検証が不合格になる", () => {
    const sales_data_invalid_amount = {
      customer_id: "CUST001",
      product_id: "PROD002",
      amount: -10000,
      transaction_datetime: "2024-01-15T09:30:00Z",
      sales_rep_id: "REP001",
    };

    expect(() => validateSalesData(sales_data_invalid_amount)).toThrow(/金額/);
  });

  test("金額が上限値を超える場合、検証が不合格になる", () => {
    const sales_data_amount_exceeded = {
      customer_id: "CUST001",
      product_id: "PROD002",
      amount: 99999999,
      transaction_datetime: "2024-01-15T09:30:00Z",
      sales_rep_id: "REP001",
    };

    expect(() => validateSalesData(sales_data_amount_exceeded)).toThrow(/上限/);
  });

  test("取引日時がシステム運用開始日より前の場合、検証が不合格になる", () => {
    const sales_data_old_date = {
      customer_id: "CUST001",
      product_id: "PROD002",
      amount: 50000,
      transaction_datetime: "2020-01-01T09:30:00Z",
      sales_rep_id: "REP001",
    };

    expect(() => validateSalesData(sales_data_old_date)).toThrow(/取引日時/);
  });

  test("データ型が正しくない場合、検証が不合格になる", () => {
    const sales_data_wrong_type = {
      customer_id: "CUST001",
      product_id: "PROD002",
      amount: "50000",
      transaction_datetime: "2024-01-15T09:30:00Z",
      sales_rep_id: "REP001",
    };

    expect(() => validateSalesData(sales_data_wrong_type)).toThrow(/データ型/);
  });

  test("すべての必須項目が有効な値で入力された場合、検証ステータスが合格になり詳細情報が返される", () => {
    const sales_data_valid = {
      customer_id: "CUST002",
      product_id: "PROD003",
      amount: 75000,
      transaction_datetime: "2024-02-20T14:45:00Z",
      sales_rep_id: "REP002",
    };

    const result = validateSalesData(sales_data_valid);

    expect(result.status).toBe("合格");
    expect(result.is_valid).toBe(true);
    expect(result.error_count).toBe(0);
    expect(result.errors.length).toBe(0);
  });
});
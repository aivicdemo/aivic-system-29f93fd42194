import { describe, it, expect, beforeEach } from "@jest/globals";
import { validateMonthlyBusinessData } from "../../src/logic/it-1781935279444-2-2-1";

describe("月次営業データの完全性・正確性検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1245
  it("すべての必須項目が揃い、データ型と値の範囲が正常な場合、集計完了判定を返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
        {
          business_date: "2024-01-16",
          business_person_id: "BP002",
          customer_id: "CUST002",
          sales_amount: 75000,
          product_code: "PROD-B",
          quantity: 5,
          billing_category: "premium",
        },
        {
          business_date: "2024-01-17",
          business_person_id: "BP001",
          customer_id: "CUST003",
          sales_amount: 120000,
          product_code: "PROD-C",
          quantity: 20,
          billing_category: "standard",
        },
      ],
    };

    const result = validateMonthlyBusinessData(monthlyBusinessData);

    expect(result.status).toBe("complete");
    expect(result.error_code).toBe(0);
    expect(result.message).toBe("月次営業データの検証が完了しました");
    expect(result.aggregation_target_count).toBe(3);
    expect(result.aggregation_complete_count).toBe(3);
    expect(result.validation_errors).toEqual([]);
    expect(result.validation_warnings).toEqual([]);
  });

  // SCEN-1245 - 境界値: 売上金額が最小値0の場合
  it("売上金額が0（最小値）の場合、集計完了判定を返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 0,
          product_code: "PROD-A",
          quantity: 1,
          billing_category: "standard",
        },
      ],
    };

    const result = validateMonthlyBusinessData(monthlyBusinessData);

    expect(result.status).toBe("complete");
    expect(result.error_code).toBe(0);
    expect(result.aggregation_target_count).toBe(1);
    expect(result.aggregation_complete_count).toBe(1);
  });

  // SCEN-1245 - 境界値: 数量が最小値1の場合
  it("数量が1（最小値）の場合、集計完了判定を返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 30000,
          product_code: "PROD-A",
          quantity: 1,
          billing_category: "standard",
        },
      ],
    };

    const result = validateMonthlyBusinessData(monthlyBusinessData);

    expect(result.status).toBe("complete");
    expect(result.error_code).toBe(0);
    expect(result.aggregation_complete_count).toBe(1);
  });

  // SCEN-1245 - エラー: 必須項目欠落（営業日付）
  it("営業日付が欠落している場合、エラーコードを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /営業日付/
    );
  });

  // SCEN-1245 - エラー: 必須項目欠落（営業担当者ID）
  it("営業担当者IDが欠落している場合、エラーコードを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /営業担当者/
    );
  });

  // SCEN-1245 - エラー: 必須項目欠落（顧客ID）
  it("顧客IDが欠落している場合、エラーコードを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /顧客/
    );
  });

  // SCEN-1245 - エラー: 必須項目欠落（売上金額）
  it("売上金額が欠落している場合、エラーコードを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /売上/
    );
  });

  // SCEN-1245 - エラー: 必須項目欠落（商品コード）
  it("商品コードが欠落している場合、エラーコードを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          quantity: 10,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /商品/
    );
  });

  // SCEN-1245 - エラー: 必須項目欠落（数量）
  it("数量が欠落している場合、エラーコードを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /数量/
    );
  });

  // SCEN-1245 - エラー: 必須項目欠落（請求区分）
  it("請求区分が欠落している場合、エラーコードを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10,
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /請求/
    );
  });

  // SCEN-1245 - エラー: データ型不正（営業日付が不正形式）
  it("営業日付のデータ型が不正な場合、エラーを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024/01/15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /日付形式/
    );
  });

  // SCEN-1245 - エラー: データ型不正（売上金額が負の値）
  it("売上金額が負の値の場合、エラーを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: -10000,
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /売上/
    );
  });

  // SCEN-1245 - エラー: データ型不正（数量が0以下）
  it("数量が0以下の場合、エラーを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 0,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /数量/
    );
  });

  // SCEN-1245 - エラー: データ型不正（数量が小数）
  it("数量が小数の場合、エラーを返す", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10.5,
          billing_category: "standard",
        },
      ],
    };

    expect(() => validateMonthlyBusinessData(monthlyBusinessData)).toThrow(
      /整数/
    );
  });

  // SCEN-1245 - 複数件検証で部分的エラー
  it("複数件中の一部がエラー条件を満たす場合、集計完了件数が減少する", () => {
    const monthlyBusinessData = {
      records: [
        {
          business_date: "2024-01-15",
          business_person_id: "BP001",
          customer_id: "CUST001",
          sales_amount: 50000,
          product_code: "PROD-A",
          quantity: 10,
          billing_category: "standard",
        },
        {
          business_date: "2024-01-16",
          business_person_id: "BP002",
          customer_id: "CUST002",
          sales_amount: -5000,
          product_code: "PROD-B",
          quantity: 5,
          billing_category: "premium",
        },
        {
          business_date: "2024-01-17",
          business_person_id: "BP001",
          customer_id: "CUST003",
          sales_amount: 120000,
          product_code: "PROD-C",
          quantity: 20,
          billing_category: "standard",
        },
      ],
    };

    const result = validateMonthlyBusinessData(monthlyBusinessData);

    expect(result.status).toBe("incomplete");
    expect(result.error_code).toBeGreaterThan(0);
    expect(result.aggregation_target_count).toBe(3);
    expect(result.aggregation_complete_count).toBe(2);
    expect(result.validation_errors.length).toBeGreaterThan(0);
  });

  // SCEN-1245 - 空レコード
  it("レコードが空の場合、集計完了件数が0となる", () => {
    const monthlyBusinessData = {
      records: [],
    };

    const result = validateMonthlyBusinessData(monthlyBusinessData);

    expect(result.status).toBe("complete");
    expect(result.error_code).toBe(0);
    expect(result.aggregation_target_count).toBe(0);
    expect(result.aggregation_complete_count).toBe(0);
  });
});
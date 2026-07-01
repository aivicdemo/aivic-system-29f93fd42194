import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-680: [normal] 営業データ品質検証ルール実行機能 - 必須項目すべてが正しく入力された営業データが検証に合格する
  test("すべての必須項目が正しく入力されているため、検証に合格し、成功ステータス（pass）が表示される", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: 150000,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result).toEqual({
      status: "pass",
      errors: [],
      warnings: [],
    });
    expect(result.status).toBe("pass");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBe(0);
  });

  test("顧客名が空文字列の場合、検証に不合格となり、エラーメッセージが返される", () => {
    const sales_data = {
      customer_name: "",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: 150000,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((err: string) => err.includes("顧客名"))).toBe(
      true
    );
  });

  test("営業担当者が未定義の場合、検証に不合格となり、エラーメッセージが返される", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: undefined,
      transaction_date: "2024-01-15",
      amount: 150000,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(
      result.errors.some((err: string) => err.includes("営業担当者"))
    ).toBe(true);
  });

  test("取引日が無効な形式の場合、検証に不合格となり、形式エラーが返される", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024/01/15",
      amount: 150000,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((err: string) => err.includes("取引日"))).toBe(
      true
    );
  });

  test("金額が負の値の場合、検証に不合格となり、範囲エラーが返される", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: -50000,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((err: string) => err.includes("金額"))).toBe(
      true
    );
  });

  test("金額が数値でない場合、検証に不合格となり、型エラーが返される", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: "150000",
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((err: string) => err.includes("金額"))).toBe(
      true
    );
  });

  test("商品コードが空文字列の場合、検証に不合格となり、エラーメッセージが返される", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: 150000,
      product_code: "",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(
      result.errors.some((err: string) => err.includes("商品コード"))
    ).toBe(true);
  });

  test("請求先住所が空文字列の場合、検証に不合格となり、エラーメッセージが返される", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: 150000,
      product_code: "PROD-001",
      billing_address: "",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(
      result.errors.some((err: string) => err.includes("請求先住所"))
    ).toBe(true);
  });

  test("複数の必須項目が欠落している場合、すべてのエラーが列挙される", () => {
    const sales_data = {
      customer_name: "",
      sales_person: "",
      transaction_date: "2024-01-15",
      amount: 150000,
      product_code: "",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.errors.some((err: string) => err.includes("顧客名"))).toBe(
      true
    );
    expect(
      result.errors.some((err: string) => err.includes("営業担当者"))
    ).toBe(true);
    expect(
      result.errors.some((err: string) => err.includes("商品コード"))
    ).toBe(true);
  });

  test("金額が0の場合、検証に合格する（0は有効な値）", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: 0,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("pass");
    expect(result.errors.length).toBe(0);
  });

  test("金額が大きな数値の場合、検証に合格する", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-01-15",
      amount: 999999999,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("pass");
    expect(result.errors.length).toBe(0);
  });

  test("取引日が有効なISO形式の場合、検証に合格する", () => {
    const sales_data = {
      customer_name: "株式会社ABC",
      sales_person: "営業太郎",
      transaction_date: "2024-12-31",
      amount: 150000,
      product_code: "PROD-001",
      billing_address: "東京都渋谷区1-1-1",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("pass");
    expect(result.errors.length).toBe(0);
  });

  test("すべての項目が正しく入力され、長い文字列を含む場合、検証に合格する", () => {
    const sales_data = {
      customer_name:
        "株式会社ABCDefghijklmnopqrstuvwxyz0123456789営業部営業チーム",
      sales_person: "営業太郎営業花子営業次郎",
      transaction_date: "2024-01-15",
      amount: 500000,
      product_code: "PROD-001-ALPHA-BETA",
      billing_address:
        "東京都渋谷区1-1-1 渋谷ビジネスセンタービル10階営業部営業課",
    };

    const result = validateSalesData(sales_data);

    expect(result.status).toBe("pass");
    expect(result.errors.length).toBe(0);
  });
});
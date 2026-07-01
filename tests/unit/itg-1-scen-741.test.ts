import { describe, test, expect } from "@jest/globals";
import { validateSalesDataIntegrity } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ自動検証ルール - 必須項目の完全性チェック", () => {
  // SCEN-741: [edge] 営業データ自動検証ルール - 営業データの必須項目が空文字列の場合、データ完全性エラーとして検出される
  test("必須項目が空文字列の場合、データ完全性エラーが検出される", () => {
    const sales_data = {
      customer_name: "",
      amount: "50000",
      transaction_date: "2024-01-15",
      service_type: "standard",
    };

    const validation_result = validateSalesDataIntegrity(sales_data);

    expect(validation_result.status).toBe("failure");
    expect(validation_result.error_type).toBe("data_integrity_error");
    expect(validation_result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "customer_name",
          error_message: expect.stringMatching(/customer_name/),
        }),
      ])
    );
    expect(validation_result.errors.length).toBeGreaterThan(0);
  });

  test("複数の必須項目が空文字列の場合、すべてのエラーが検出される", () => {
    const sales_data = {
      customer_name: "",
      amount: "",
      transaction_date: "2024-01-15",
      service_type: "",
    };

    const validation_result = validateSalesDataIntegrity(sales_data);

    expect(validation_result.status).toBe("failure");
    expect(validation_result.error_type).toBe("data_integrity_error");
    expect(validation_result.errors.length).toBe(3);
    expect(validation_result.errors.map((e) => e.field_name)).toEqual(
      expect.arrayContaining(["customer_name", "amount", "service_type"])
    );
  });

  test("すべての必須項目が正常に入力された場合、検証に成功する", () => {
    const sales_data = {
      customer_name: "ABC Corporation",
      amount: "75000",
      transaction_date: "2024-01-20",
      service_type: "premium",
    };

    const validation_result = validateSalesDataIntegrity(sales_data);

    expect(validation_result.status).toBe("success");
    expect(validation_result.error_type).toBeNull();
    expect(validation_result.errors).toEqual([]);
  });

  test("金額フィールドが空文字列で、その他は正常な場合、該当フィールドのみエラー検出", () => {
    const sales_data = {
      customer_name: "XYZ Company",
      amount: "",
      transaction_date: "2024-01-25",
      service_type: "standard",
    };

    const validation_result = validateSalesDataIntegrity(sales_data);

    expect(validation_result.status).toBe("failure");
    expect(validation_result.error_type).toBe("data_integrity_error");
    expect(validation_result.errors.length).toBe(1);
    expect(validation_result.errors[0].field_name).toBe("amount");
  });

  test("取引日が空文字列の場合、データ完全性エラーが検出される", () => {
    const sales_data = {
      customer_name: "Test Client",
      amount: "100000",
      transaction_date: "",
      service_type: "premium",
    };

    const validation_result = validateSalesDataIntegrity(sales_data);

    expect(validation_result.status).toBe("failure");
    expect(validation_result.error_type).toBe("data_integrity_error");
    expect(
      validation_result.errors.some((e) => e.field_name === "transaction_date")
    ).toBe(true);
  });

  test("エラーメッセージに検出された項目の詳細情報が含まれている", () => {
    const sales_data = {
      customer_name: "",
      amount: "60000",
      transaction_date: "2024-02-01",
      service_type: "standard",
    };

    const validation_result = validateSalesDataIntegrity(sales_data);

    expect(validation_result.errors.length).toBeGreaterThan(0);
    const error_message_combined = validation_result.errors
      .map((e) => e.error_message)
      .join(" ");
    expect(error_message_combined).toMatch(/customer_name/);
  });
});
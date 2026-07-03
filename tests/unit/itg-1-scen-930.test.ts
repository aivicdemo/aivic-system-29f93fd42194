import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-930: [edge] 営業データ品質検証ルール適用 - 必須項目値が空文字列の場合、欠落と同等に検出される
  test("必須項目が空文字列の場合、null/undefinedと同等のエラー（欠落エラー）が検出される", () => {
    const validationRules = {
      requiredFields: ["customer_name", "amount", "contact_date"],
      fieldTypes: {
        customer_name: "string",
        amount: "number",
        contact_date: "string",
      },
    };

    // テストケース1: 必須項目が空文字列で設定されたデータ
    const salesDataWithEmptyString = {
      customer_name: "",
      amount: 50000,
      contact_date: "2024-01-15",
    };

    // テストケース2: 同じ項目がnullで設定されたデータ
    const salesDataWithNull = {
      customer_name: null,
      amount: 50000,
      contact_date: "2024-01-15",
    };

    // テストケース3: 同じ項目がundefinedで設定されたデータ
    const salesDataWithUndefined = {
      customer_name: undefined,
      amount: 50000,
      contact_date: "2024-01-15",
    };

    // 空文字列での検証実行
    const resultEmptyString = validateSalesDataQuality(
      salesDataWithEmptyString,
      validationRules
    );

    // nullでの検証実行
    const resultNull = validateSalesDataQuality(
      salesDataWithNull,
      validationRules
    );

    // undefinedでの検証実行
    const resultUndefined = validateSalesDataQuality(
      salesDataWithUndefined,
      validationRules
    );

    // 空文字列の場合、エラーが検出されることを確認
    expect(resultEmptyString.isValid).toBe(false);
    expect(resultEmptyString.errors).toContainEqual({
      field: "customer_name",
      errorCode: "REQUIRED_FIELD_MISSING",
      message: "顧客名は必須項目です",
    });

    // nullの場合、同じエラーが検出されることを確認
    expect(resultNull.isValid).toBe(false);
    expect(resultNull.errors).toContainEqual({
      field: "customer_name",
      errorCode: "REQUIRED_FIELD_MISSING",
      message: "顧客名は必須項目です",
    });

    // undefinedの場合、同じエラーが検出されることを確認
    expect(resultUndefined.isValid).toBe(false);
    expect(resultUndefined.errors).toContainEqual({
      field: "customer_name",
      errorCode: "REQUIRED_FIELD_MISSING",
      message: "顧客名は必須項目です",
    });

    // 3つのケースすべてで同じエラーコードが返されることを確認
    expect(resultEmptyString.errors[0].errorCode).toBe(
      resultNull.errors[0].errorCode
    );
    expect(resultNull.errors[0].errorCode).toBe(
      resultUndefined.errors[0].errorCode
    );

    // 3つのケースすべてで同じエラーメッセージが返されることを確認
    expect(resultEmptyString.errors[0].message).toBe(
      resultNull.errors[0].message
    );
    expect(resultNull.errors[0].message).toBe(
      resultUndefined.errors[0].message
    );

    // 複数の必須項目が空文字列の場合、複数のエラーが検出されることを確認
    const multipleEmptyFields = {
      customer_name: "",
      amount: 50000,
      contact_date: "",
    };

    const resultMultiple = validateSalesDataQuality(
      multipleEmptyFields,
      validationRules
    );

    expect(resultMultiple.isValid).toBe(false);
    expect(resultMultiple.errors).toHaveLength(2);
    expect(resultMultiple.errors[0].field).toBe("customer_name");
    expect(resultMultiple.errors[1].field).toBe("contact_date");

    // 必須項目が正常に入力されている場合、検証に合格することを確認
    const validSalesData = {
      customer_name: "テスト顧客A",
      amount: 50000,
      contact_date: "2024-01-15",
    };

    const resultValid = validateSalesDataQuality(
      validSalesData,
      validationRules
    );

    expect(resultValid.isValid).toBe(true);
    expect(resultValid.errors).toHaveLength(0);
  });
});
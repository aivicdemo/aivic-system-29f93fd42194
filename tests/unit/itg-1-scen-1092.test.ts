import { describe, test, expect } from "@jest/globals";
import { validateDocumentReflection } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1092: [error] ドキュメント反映・更新機能 - ドキュメント反映時に必須項目が欠落している場合にエラーが発生する
  test("必須項目が欠落している場合にエラーが発生する", () => {
    // 必須項目（顧客名）が欠落したドキュメント入力
    const input_missing_customer_name = {
      customer_name: "",
      amount: 50000,
      date: "2024-01-15",
      service_type: "consulting",
    };

    // 顧客名が欠落している場合のエラーをテスト
    expect(() =>
      validateDocumentReflection(input_missing_customer_name)
    ).toThrow(/顧客名/);

    // 必須項目（金額）が欠落したドキュメント入力
    const input_missing_amount = {
      customer_name: "Company A",
      amount: null,
      date: "2024-01-15",
      service_type: "consulting",
    };

    // 金額が欠落している場合のエラーをテスト
    expect(() =>
      validateDocumentReflection(input_missing_amount)
    ).toThrow(/金額/);

    // 必須項目（日付）が欠落したドキュメント入力
    const input_missing_date = {
      customer_name: "Company B",
      amount: 75000,
      date: "",
      service_type: "support",
    };

    // 日付が欠落している場合のエラーをテスト
    expect(() =>
      validateDocumentReflection(input_missing_date)
    ).toThrow(/日付/);

    // すべての必須項目が正しく入力されたドキュメント入力
    const input_valid = {
      customer_name: "Company C",
      amount: 100000,
      date: "2024-01-20",
      service_type: "planning",
    };

    // 成功ケース：すべての必須項目が揃っている場合
    const result = validateDocumentReflection(input_valid);
    expect(result).toEqual({
      is_valid: true,
      errors: [],
      document_id: expect.any(String),
      reflected_at: expect.any(String),
    });

    // 複数の必須項目が欠落している場合
    const input_multiple_missing = {
      customer_name: "",
      amount: undefined,
      date: "2024-01-15",
      service_type: "",
    };

    // 複数欠落の場合もエラーをスロー（最初に検出された項目で検証）
    expect(() =>
      validateDocumentReflection(input_multiple_missing)
    ).toThrow(/顧客名/);
  });
});
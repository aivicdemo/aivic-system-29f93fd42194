import { describe, it, expect } from "@jest/globals";
import { executeValidationRules } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール実行機能", () => {
  it("SCEN-683: 複数の必須項目が同時に欠落している場合にすべてのエラーが列挙される", () => {
    // Arrange: 必須項目（顧客名、金額、商品コード、担当者ID）がすべて欠落した営業データレコード
    const salesDataRecord = {
      customer_name: null,
      amount: null,
      product_code: null,
      staff_id: null,
      contact_date: "2024-01-15",
      notes: "テスト",
    };

    // Act: 検証ルール実行関数に上記データレコードを入力
    const validationResult = executeValidationRules(salesDataRecord);

    // Assert: エラー配列の要素数を検証
    expect(validationResult.errors.length).toBe(4);

    // Assert: エラー配列内の各エラーメッセージを確認し、各エラーが対応する欠落項目を特定
    const errorMessages = validationResult.errors.map((err: any) => err.field);
    expect(errorMessages).toContain("customer_name");
    expect(errorMessages).toContain("amount");
    expect(errorMessages).toContain("product_code");
    expect(errorMessages).toContain("staff_id");

    // Assert: エラーの重複がないことを検証（Set で重複チェック）
    const uniqueErrorFields = new Set(errorMessages);
    expect(uniqueErrorFields.size).toBe(4);

    // Assert: すべてのエラーが「必須項目欠落」タイプであることを確認
    validationResult.errors.forEach((err: any) => {
      expect(err.type).toBe("required_field_missing");
    });

    // Assert: 検証結果が不合格であること
    expect(validationResult.is_valid).toBe(false);
  });
});
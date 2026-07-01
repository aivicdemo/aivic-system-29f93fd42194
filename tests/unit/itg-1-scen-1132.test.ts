import { describe, test, expect } from "@jest/globals";
import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 数値項目の型チェック", () => {
  // SCEN-1132
  test("数値項目に文字列が入力された営業データが型チェックエラーとして検出される", () => {
    // Arrange: テストデータ準備 - 数値項目に文字列値を含む営業データ
    const invalidSalesData = {
      salesAmount: "ABC",
      quantity: "テスト",
      date: "2024-01-15",
      customerId: 12345,
      serviceName: "営業支援サービス",
    };

    // Act & Assert: 検証実行とエラー期待値確認
    expect(() => validateSalesData(invalidSalesData)).toThrow(/型/);

    // Act: エラーメッセージ詳細検証
    try {
      validateSalesData(invalidSalesData);
      // 上記で throw が発生しなかった場合のフォールバック（到達しない想定）
      expect(true).toBe(false);
    } catch (error) {
      const errorMessage = (error as Error).message;
      // エラーメッセージに不正な項目名が含まれることを確認
      expect(errorMessage).toMatch(/salesAmount|quantity/);
      // エラーメッセージに期待される型（数値）が含まれることを確認
      expect(errorMessage).toMatch(/数値|number/);
      // エラーメッセージに実際の入力値（文字列）の説明が含まれることを確認
      expect(errorMessage).toMatch(/文字列|string/);
    }

    // Assert: 数値型で正常な営業データは検証をパスすることを確認
    const validSalesData = {
      salesAmount: 150000,
      quantity: 5,
      date: "2024-01-15",
      customerId: 12345,
      serviceName: "営業支援サービス",
    };

    const result = validateSalesData(validSalesData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);

    // Assert: 複数の数値項目の型エラーを同時に検出
    const multipleInvalidData = {
      salesAmount: "invalid_amount",
      quantity: "invalid_qty",
      date: "2024-01-15",
      customerId: 12345,
      serviceName: "営業支援サービス",
    };

    expect(() => validateSalesData(multipleInvalidData)).toThrow(/型/);
  });
});
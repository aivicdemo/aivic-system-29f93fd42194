import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ品質検証 - 必須項目チェック", () => {
  test("SCEN-1100: 必須項目が全て存在し、データ型が正しい場合に検証成功と判定される", () => {
    // Arrange: テストデータの準備
    const testData = {
      customerId: "CUST-001",
      productName: "営業支援ツール",
      amount: 150000,
      transactionDateTime: "2024-01-15T14:30:00Z",
    };

    // Act: 検証関数を実行
    const validationResult = validateSalesDataQuality(testData);

    // Assert: 検証結果を確認
    // 成功ステータスの確認
    expect(validationResult.isValid).toBe(true);

    // 全ての必須項目がバリデーション完了状態であることを確認
    expect(validationResult.validatedFields).toEqual({
      customerId: true,
      productName: true,
      amount: true,
      transactionDateTime: true,
    });

    // エラーメッセージが空配列であることを確認
    expect(validationResult.errors).toEqual([]);

    // 各必須項目のデータ型が正しく認識されていることを確認
    expect(typeof testData.customerId).toBe("string");
    expect(typeof testData.productName).toBe("string");
    expect(typeof testData.amount).toBe("number");
    expect(testData.transactionDateTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 検証結果に詳細情報が含まれていることを確認
    expect(validationResult.timestamp).toBeDefined();
    expect(validationResult.validationRuleVersion).toBe("1.0");
  });
});
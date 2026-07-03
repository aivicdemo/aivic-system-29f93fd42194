import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1104
  test("数値項目がゼロの場合に有効なデータとして処理される", () => {
    // Arrange: ゼロ値を含むテストデータを準備
    const testData = {
      salesAmount: 0,
      quantity: 0,
      discountRate: 0,
      customerId: "CUST001",
      serviceId: "SVC001",
      transactionDate: "2024-01-15T10:30:00Z",
      status: "completed",
    };

    // Act: バリデーション処理を実行
    const validationResult = validateSalesData(testData);

    // Assert: ゼロ値を含むデータがバリデーションエラーとして判定されないことを確認
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual([]);

    // Assert: ゼロ値を含むデータが請求自動化システムへ正常に連携されることを確認
    expect(validationResult.canProceedToBilling).toBe(true);

    // Assert: 処理ログにゼロ値が有効なデータとして記録されていることを確認
    expect(validationResult.validatedFields).toEqual({
      salesAmount: 0,
      quantity: 0,
      discountRate: 0,
    });

    expect(validationResult.processLog).toContain("ゼロ値");
    expect(validationResult.processLog).toContain("有効");

    // Assert: 複数の数値項目がゼロでも全体的に有効
    expect(validationResult.dataStatus).toBe("valid");
  });
});
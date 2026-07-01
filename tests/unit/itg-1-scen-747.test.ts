import { calculateBillingAmount } from "../../src/logic/it-1-2-1";

describe("請求対象項目の自動抽出と請求額集計", () => {
  test("SCEN-747: 請求対象数量がゼロの場合、請求額は0円として集計される", () => {
    // Arrange: テスト用営業データを準備（請求対象数量が0に設定）
    const salesData = {
      customerId: "CUST001",
      serviceId: "SVC001",
      billingTargetQuantity: 0,
      unitPrice: 10000,
      discountRate: 0,
    };

    // Act: 請求額の自動集計処理を実行
    const result = calculateBillingAmount(salesData);

    // Assert: 請求額が0円として正確に集計されることを確認
    expect(result).toEqual({
      customerId: "CUST001",
      serviceId: "SVC001",
      baseAmount: 0,
      discountAmount: 0,
      billingAmount: 0,
    });

    expect(result.billingAmount).toBe(0);
    expect(result.baseAmount).toBe(0);
    expect(result.discountAmount).toBe(0);
  });
});
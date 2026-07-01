import { validateSalesData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-710: 金額が負数の場合に不正形式として検出される", () => {
    const invalidSalesData = {
      customerId: "CUST-001",
      customerName: "テスト顧客",
      serviceType: "basic",
      contactDate: "2024-01-15",
      appointmentCount: 5,
      contractCount: 2,
      amount: -1000,
      status: "completed",
    };

    const result = validateSalesData(invalidSalesData);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        fieldName: "amount",
        message: expect.stringMatching(/金額が負数|負数|金額/i),
        level: "error",
      })
    );
  });
});
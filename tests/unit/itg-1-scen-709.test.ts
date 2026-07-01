import { validateSalesDataContractDateConsistency } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-709: 契約日より前の売上記録日が検出され矛盾エラーとなる", () => {
    // Arrange: テストデータ準備
    const contractDate = new Date("2024-06-01T00:00:00Z");
    const salesRecordDate = new Date("2024-05-15T00:00:00Z");
    
    const salesRecord = {
      recordId: "SR-001",
      customerId: "CUST-123",
      contractDate: contractDate,
      salesRecordDate: salesRecordDate,
      amount: 50000,
    };

    // Act & Assert: 矛盾エラーが発生することを検証
    expect(() => {
      validateSalesDataContractDateConsistency(salesRecord);
    }).toThrow(/契約日/);
  });
});
import { extractAndAggregateInvoiceItems } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データから請求対象項目の自動抽出・集計", () => {
  // SCEN-1009: [edge] 請求対象項目の数量が0またはマイナス値の場合、集計対象外または警告として処理される
  test("数量が0またはマイナス値のレコードは除外され、警告が出力される", () => {
    const salesData = [
      {
        id: "rec_001",
        customerId: "cust_A",
        serviceType: "service_X",
        quantity: 5,
        unitPrice: 1000,
        recordDate: "2024-01-15",
      },
      {
        id: "rec_002",
        customerId: "cust_A",
        serviceType: "service_X",
        quantity: 0,
        unitPrice: 1000,
        recordDate: "2024-01-16",
      },
      {
        id: "rec_003",
        customerId: "cust_A",
        serviceType: "service_X",
        quantity: 3,
        unitPrice: 1000,
        recordDate: "2024-01-17",
      },
      {
        id: "rec_004",
        customerId: "cust_A",
        serviceType: "service_X",
        quantity: -1,
        unitPrice: 1000,
        recordDate: "2024-01-18",
      },
      {
        id: "rec_005",
        customerId: "cust_A",
        serviceType: "service_X",
        quantity: 2,
        unitPrice: 1000,
        recordDate: "2024-01-19",
      },
      {
        id: "rec_006",
        customerId: "cust_A",
        serviceType: "service_X",
        quantity: -100,
        unitPrice: 1000,
        recordDate: "2024-01-20",
      },
    ];

    const result = extractAndAggregateInvoiceItems(salesData);

    // 正常な数量値のレコードのみが集計対象として含まれること
    expect(result.includedRecords.length).toBe(3);
    expect(result.includedRecords.map((r: any) => r.id)).toEqual([
      "rec_001",
      "rec_003",
      "rec_005",
    ]);

    // 数量0またはマイナス値のレコードが除外されていることを確認
    expect(result.excludedRecords.length).toBe(3);
    expect(result.excludedRecords.map((r: any) => r.id)).toEqual([
      "rec_002",
      "rec_004",
      "rec_006",
    ]);

    // 集計結果の合計値が正しく計算されること
    // 正常レコード: quantity 5 + 3 + 2 = 10 → 10 * 1000 = 10000
    expect(result.aggregatedAmount).toBe(10000);

    // 警告メッセージが出力されていることを確認
    expect(result.warnings.length).toBe(3);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        recordId: "rec_002",
        message: expect.stringMatching(/数量/),
      })
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        recordId: "rec_004",
        message: expect.stringMatching(/数量/),
      })
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        recordId: "rec_006",
        message: expect.stringMatching(/数量/),
      })
    );

    // 顧客別の集計結果が正確であることを確認
    expect(result.aggregationByCustomer).toEqual({
      cust_A: {
        totalQuantity: 10,
        totalAmount: 10000,
        recordCount: 3,
      },
    });

    // サービス別の集計結果が正確であることを確認
    expect(result.aggregationByService).toEqual({
      service_X: {
        totalQuantity: 10,
        totalAmount: 10000,
        recordCount: 3,
      },
    });
  });
});
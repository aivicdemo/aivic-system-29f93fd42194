import {
  validateSalesData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・異常検出", () => {
  test("SCEN-1167: 必須項目が全て存在し、データ型が正常な営業データは検証合格と判定される", () => {
    // 準備: テスト対象の営業データを準備（全必須項目を含む）
    const salesData = {
      customer_id: 12345,
      customer_name: "ABC Corporation",
      sales_amount: 150000,
      transaction_date: "2024-01-15T10:30:00Z",
      product_code: "PROD-001",
      quantity: 5,
      unit_price: 30000,
      sales_representative_id: 789,
    };

    // 実行: データ品質検証モジュールに入力
    const result = validateSalesData(salesData);

    // 検証: 検証結果が『合格』と判定されることを確認
    expect(result.status).toBe("pass");
    expect(result.errors).toEqual([]);
    expect(result.error_message).toBeUndefined();
    expect(result.status_code).toBe(200);
  });
});
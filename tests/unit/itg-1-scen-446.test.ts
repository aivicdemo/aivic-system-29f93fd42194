import { validateInventoryCountInput } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("SCEN-446: [error] 棚卸データ妥当性検証機能 - 入力ミスのある棚卸データでアラート通知される", () => {
    // SCEN-446
    
    const itemCode = "INVALID001"; // 存在しない商品コード
    const countedQuantity = -10; // 負の値
    const systemQuantity = 100; // システム上の理論在庫数量
    const lastCountDate = new Date("2024-01-01T10:00:00Z");
    
    expect(() => {
      validateInventoryCountInput(itemCode, countedQuantity, systemQuantity, lastCountDate);
    }).toThrow(/品目コード/);
  });
});
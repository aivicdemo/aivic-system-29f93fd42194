import { validateInventoryUpdateDuringStocktaking } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("SCEN-466: 棚卸期間外の在庫更新処理で制御が適用されずエラーとなる", () => {
    const stocktakingStatus = "completed";
    const requestedOperation = "inventory_update";
    const targetItemCode = "ITEM001";

    const result = validateInventoryUpdateDuringStocktaking(
      stocktakingStatus,
      requestedOperation,
      targetItemCode
    );

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("");
    expect(result.deferredUntil).toBe(null);
  });
});
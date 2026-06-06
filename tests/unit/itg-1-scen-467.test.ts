import { validateInventoryUpdateDuringStocktaking } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("棚卸開始直前の在庫更新処理の制御判定が正しく動作する", () => {
    // SCEN-467
    
    // 棚卸開始前（1分前）の在庫更新処理
    const stocktakingStatusBefore = "pending";
    const inventoryUpdateRequest = "stock_in";
    const targetItemCode = "MAT-001";
    
    const resultBefore = validateInventoryUpdateDuringStocktaking(
      stocktakingStatusBefore,
      inventoryUpdateRequest,
      targetItemCode
    );
    
    // 棚卸開始前は在庫更新処理が正常に実行される
    expect(resultBefore.allowed).toBe(true);
    expect(resultBefore.reason).toBe("");
    expect(resultBefore.deferredUntil).toBe(null);
    
    // 棚卸開始時刻以降の在庫更新処理
    const stocktakingStatusDuring = "in_progress";
    
    const resultDuring = validateInventoryUpdateDuringStocktaking(
      stocktakingStatusDuring,
      inventoryUpdateRequest,
      targetItemCode
    );
    
    // 棚卸開始時刻以降は在庫更新処理が制御される
    expect(resultDuring.allowed).toBe(false);
    expect(resultDuring.reason).toBe("棚卸作業中のため在庫更新を一時停止しています");
    expect(resultDuring.deferredUntil).toBeDefined();
  });
});
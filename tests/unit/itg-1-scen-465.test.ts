import { validateInventoryUpdateDuringStocktaking } from "../../src/logic/it-1-br-1-2-1";

describe("棚卸期間中在庫更新制御機能", () => {
  test("棚卸期間中に在庫更新処理を正常に一時停止する", () => {
    // SCEN-465
    const result = validateInventoryUpdateDuringStocktaking(
      "in_progress",
      "入庫",
      "ITEM001"
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("棚卸作業中のため在庫更新を一時停止しています");
    expect(result.deferredUntil).toBe("2024-01-15T18:00:00Z");
  });
});
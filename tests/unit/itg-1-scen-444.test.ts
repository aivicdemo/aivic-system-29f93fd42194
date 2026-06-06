import { validateInventoryCountInput } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("正常な棚卸結果データで妥当性検証がパスする", () => {
    // SCEN-444
    
    const itemCode = "ITEM001";
    const countedQuantity = 150;
    const systemQuantity = 140;
    const lastCountDate = new Date("2024-01-01T00:00:00Z");

    const result = validateInventoryCountInput(itemCode, countedQuantity, systemQuantity, lastCountDate);

    expect(result.isValid).toBe(true);
    expect(result.errorMessages).toEqual([]);
    expect(result.warningMessages).toEqual([]);
    expect(result.variancePercentage).toBe((10 / 140) * 100);
  });
});
import { validateInventoryCountInput } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("境界値の棚卸数量で妥当性検証される", () => {
    // SCEN-447
    const itemCode = "ITEM001";
    const systemQuantity = 100;
    const lastCountDate = new Date("2024-01-01T10:00:00Z");

    // 最小境界値（0）で妥当性検証 - 正常
    const minBoundaryResult = validateInventoryCountInput({
      itemCode,
      countedQuantity: 0,
      systemQuantity,
      lastCountDate
    });
    expect(minBoundaryResult.isValid).toBe(true);
    expect(minBoundaryResult.errorMessages).toEqual([]);

    // 最大境界値（システム上限値10000）で妥当性検証 - 正常
    const maxBoundaryResult = validateInventoryCountInput({
      itemCode,
      countedQuantity: 10000,
      systemQuantity,
      lastCountDate
    });
    expect(maxBoundaryResult.isValid).toBe(true);
    expect(maxBoundaryResult.errorMessages).toEqual([]);

    // 最小境界値未満（-1）で妥当性検証 - エラー
    expect(() => validateInventoryCountInput({
      itemCode,
      countedQuantity: -1,
      systemQuantity,
      lastCountDate
    })).toThrow(/数量/);

    // 最大境界値超過（10001）で妥当性検証 - 警告
    const overMaxResult = validateInventoryCountInput({
      itemCode,
      countedQuantity: 10001,
      systemQuantity,
      lastCountDate
    });
    expect(overMaxResult.warningMessages).toEqual(["数量が非常に大きいです。入力に間違いがないか確認してください"]);
  });
});
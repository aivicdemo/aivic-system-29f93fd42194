import { validateInventoryDataConsistency } from "../../src/logic/it-1780551315784-2-2-1";

describe("作業完了時に品質基準への適合状況を測定し記録する機能", () => {
  test("差異が許容範囲を超える場合に再調査要求を返す", () => {
    // SCEN-463
    // 差異が許容範囲（10%）を超えるテストデータを準備
    const stocktakingResults = [
      { item_code: "ITEM001", actual_quantity: 55 },
      { item_code: "ITEM002", actual_quantity: 85 },
      { item_code: "ITEM003", actual_quantity: 45 }
    ];

    const systemInventoryData = [
      { item_code: "ITEM001", theoretical_quantity: 100 },
      { item_code: "ITEM002", theoretical_quantity: 100 },
      { item_code: "ITEM003", theoretical_quantity: 100 }
    ];

    // 許容範囲10%を設定
    const toleranceThreshold = 0.10;

    // 差異が許容範囲を超える在庫データで検証実行
    const result = validateInventoryDataConsistency(stocktakingResults, systemInventoryData, toleranceThreshold);

    // 期待結果: 差異が許容範囲を超えているため再調査要求
    expect(result.isValid).toBe(false);
    expect(result.discrepancies.length).toBe(3);
    expect(result.discrepancies).toEqual([
      { item_code: "ITEM001", difference: -45, discrepancyRate: 0.45 },
      { item_code: "ITEM002", difference: -15, discrepancyRate: 0.15 },
      { item_code: "ITEM003", difference: -55, discrepancyRate: 0.55 }
    ]);
    expect(result.requiredAction).toBe("差異品目の再調査");
    expect(result.totalDiscrepancyRate).toBe(0.115);
  });
});
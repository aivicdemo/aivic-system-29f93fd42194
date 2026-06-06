import { validateInventoryDataConsistency } from '../../src/logic/it-1780551315784-2-2-1';

describe("作業完了時に品質基準への適合状況を測定し記録する機能", () => {
  // SCEN-464: [edge] 在庫データ整合性検証機能 - 差異が許容範囲の境界値の場合の判定処理が正しく動作する
  test("差異が許容範囲の境界値の場合の判定処理", () => {
    const baseInventoryData = [
      {
        item_code: "MAT001",
        theoretical_quantity: 100,
        actual_quantity: 100
      }
    ];

    const reportingPeriod = {
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    };

    // 許容範囲上限境界値（105個）での検証
    const upperBoundaryInventory = [
      {
        item_code: "MAT001",
        theoretical_quantity: 100,
        actual_quantity: 105
      }
    ];

    const upperBoundaryResult = validateInventoryDataConsistency(
      upperBoundaryInventory,
      upperBoundaryInventory,
      baseInventoryData,
      reportingPeriod
    );

    expect(upperBoundaryResult.isValid).toBe(true);

    // 許容範囲下限境界値（95個）での検証
    const lowerBoundaryInventory = [
      {
        item_code: "MAT001",
        theoretical_quantity: 100,
        actual_quantity: 95
      }
    ];

    const lowerBoundaryResult = validateInventoryDataConsistency(
      lowerBoundaryInventory,
      lowerBoundaryInventory,
      baseInventoryData,
      reportingPeriod
    );

    expect(lowerBoundaryResult.isValid).toBe(true);

    // 許容範囲を1個超過した値（106個）での検証
    const exceededUpperInventory = [
      {
        item_code: "MAT001",
        theoretical_quantity: 100,
        actual_quantity: 106
      }
    ];

    const exceededUpperResult = validateInventoryDataConsistency(
      exceededUpperInventory,
      exceededUpperInventory,
      baseInventoryData,
      reportingPeriod
    );

    expect(exceededUpperResult.isValid).toBe(false);
    expect(exceededUpperResult.inconsistencies.length).toBeGreaterThan(0);

    // 許容範囲を1個下回った値（94個）での検証
    const exceededLowerInventory = [
      {
        item_code: "MAT001",
        theoretical_quantity: 100,
        actual_quantity: 94
      }
    ];

    const exceededLowerResult = validateInventoryDataConsistency(
      exceededLowerInventory,
      exceededLowerInventory,
      baseInventoryData,
      reportingPeriod
    );

    expect(exceededLowerResult.isValid).toBe(false);
    expect(exceededLowerResult.inconsistencies.length).toBeGreaterThan(0);
  });
});
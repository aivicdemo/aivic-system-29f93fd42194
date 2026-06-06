import { validateOrderConfirmationStatus } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("生産能力が限界値ちょうどの場合に生産指示作成可否が正しく判定される", () => {
    // SCEN-337

    // 生産能力限界値ちょうど（残り1個/日）の場合
    const orderData1 = {
      customer_id: "CUST001",
      product_spec: "標準製品A型 材質:ステンレス 寸法:100x200mm",
      delivery_date: "2024-02-15",
      quantity: 1,
      unit_price: 5000
    };

    const productionCapacity1 = {
      dailyCapacity: 1000,
      currentUsage: 999,
      availableCapacity: 1
    };

    const materialInventory1 = [
      {
        material_id: "MAT001",
        current_stock: 100,
        required_quantity: 1,
        available: true
      }
    ];

    const result1 = validateOrderConfirmationStatus(orderData1, productionCapacity1, materialInventory1);

    expect(result1.isConfirmed).toBe(true);
    expect(result1.missingItems).toEqual([]);
    expect(result1.productionFeasible).toBe(true);
    expect(result1.requiredActions).toEqual([]);

    // 生産能力限界値を超える（残り0個/日で追加1個要求）の場合
    const orderData2 = {
      customer_id: "CUST002",
      product_spec: "標準製品B型 材質:アルミ 寸法:150x300mm",
      delivery_date: "2024-02-15",
      quantity: 1,
      unit_price: 6000
    };

    const productionCapacity2 = {
      dailyCapacity: 1000,
      currentUsage: 1000,
      availableCapacity: 0
    };

    const materialInventory2 = [
      {
        material_id: "MAT002",
        current_stock: 50,
        required_quantity: 1,
        available: true
      }
    ];

    const result2 = validateOrderConfirmationStatus(orderData2, productionCapacity2, materialInventory2);

    expect(result2.isConfirmed).toBe(false);
    expect(result2.missingItems).toEqual([]);
    expect(result2.productionFeasible).toBe(false);
    expect(result2.requiredActions).toEqual(["生産計画の調整が必要"]);
  });
});
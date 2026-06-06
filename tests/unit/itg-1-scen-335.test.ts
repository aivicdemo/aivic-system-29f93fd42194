import { validateOrderConfirmationStatus } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("完全な受注データと十分な生産能力がある場合に生産指示作成可能と判定される", () => {
    // SCEN-335
    const orderData = {
      customer_id: "CUST001",
      product_spec: "高強度コンクリート 30MPa 型枠寸法300x600x200mm",
      delivery_date: "2024-03-15",
      quantity: 100,
      unit_price: 15000
    };

    const productionCapacity = {
      dailyCapacity: 200,
      currentLoad: 50,
      availableDays: 20
    };

    const materialInventory = [
      {
        materialId: "MAT001",
        availableQuantity: 500,
        requiredQuantity: 100
      },
      {
        materialId: "MAT002", 
        availableQuantity: 300,
        requiredQuantity: 80
      }
    ];

    const result = validateOrderConfirmationStatus(orderData, productionCapacity, materialInventory);

    expect(result.isConfirmed).toBe(true);
    expect(result.missingItems).toEqual([]);
    expect(result.productionFeasible).toBe(true);
    expect(result.requiredActions).toEqual([]);
  });
});
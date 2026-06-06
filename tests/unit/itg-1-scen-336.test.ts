import { validateOrderConfirmationStatus } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  // SCEN-336
  test("受注データに必須項目が不足している場合に生産指示作成不可と判定される", () => {
    const orderData = {
      customer_id: "CUST001",
      product_spec: "", // 製品仕様が空
      delivery_date: "2024-03-15",
      quantity: 100,
      unit_price: 5000
    };

    const productionCapacity = {
      equipment_utilization: 70,
      available_hours: 160,
      staff_count: 10
    };

    const materialInventory = [
      {
        material_id: "MAT001",
        current_stock: 500,
        availability: true
      }
    ];

    expect(() => {
      validateOrderConfirmationStatus(orderData, productionCapacity, materialInventory);
    }).toThrow(/製品仕様/);
  });
});
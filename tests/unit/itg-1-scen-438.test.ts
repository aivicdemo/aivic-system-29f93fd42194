import { extractInventoryItemsForStocktaking } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("棚卸対象品目リスト出力機能 - 在庫管理対象外の品目が棚卸リストから除外される", () => {
    // SCEN-438
    const stocktakingDate = new Date("2024-01-15");
    const warehouseCode = "WH001";
    const itemCategoryFilter = ["建材", "資材"];
    const minimumValueThreshold = 1000;
    
    const allInventoryItems = [
      {
        itemCode: "ITEM001",
        itemName: "セメント",
        warehouseCode: "WH001",
        category: "建材",
        theoreticalQuantity: 100,
        unitPrice: 50,
        isInventoryManaged: true
      },
      {
        itemCode: "ITEM002", 
        itemName: "鉄筋",
        warehouseCode: "WH001",
        category: "資材",
        theoreticalQuantity: 200,
        unitPrice: 100,
        isInventoryManaged: true
      },
      {
        itemCode: "ITEM003",
        itemName: "消耗品A",
        warehouseCode: "WH001", 
        category: "建材",
        theoreticalQuantity: 50,
        unitPrice: 30,
        isInventoryManaged: false
      },
      {
        itemCode: "ITEM004",
        itemName: "消耗品B",
        warehouseCode: "WH001",
        category: "資材", 
        theoreticalQuantity: 80,
        unitPrice: 25,
        isInventoryManaged: false
      }
    ];

    const result = extractInventoryItemsForStocktaking(
      stocktakingDate,
      warehouseCode,
      itemCategoryFilter,
      minimumValueThreshold,
      allInventoryItems
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      itemCode: "ITEM001",
      itemName: "セメント",
      warehouseCode: "WH001",
      category: "建材",
      theoreticalQuantity: 100,
      unitPrice: 50,
      inventoryValue: 5000,
      isInventoryManaged: true
    });
    expect(result.items[1]).toEqual({
      itemCode: "ITEM002",
      itemName: "鉄筋", 
      warehouseCode: "WH001",
      category: "資材",
      theoreticalQuantity: 200,
      unitPrice: 100,
      inventoryValue: 20000,
      isInventoryManaged: true
    });
    expect(result.totalItemCount).toBe(2);
    expect(result.totalInventoryValue).toBe(25000);

    // 在庫管理対象外品目が除外されていることを確認
    const excludedItems = result.items.filter(item => 
      item.itemCode === "ITEM003" || item.itemCode === "ITEM004"
    );
    expect(excludedItems).toHaveLength(0);
  });
});
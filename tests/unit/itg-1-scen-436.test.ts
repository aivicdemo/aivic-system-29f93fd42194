import { extractInventoryItemsForStocktaking } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("月次棚卸実施日時点で棚卸条件に合致する全品目が正しく抽出される", () => {
    // SCEN-436
    const stocktakingDate = new Date("2024-03-31");
    const warehouseCode = "WH001";
    const itemCategoryFilter = ["A", "B", "C"];
    const minimumValueThreshold = 5000;
    const allInventoryItems = [
      {
        itemCode: "ITEM001",
        itemName: "建材A",
        warehouseCode: "WH001",
        category: "A",
        theoreticalQuantity: 100,
        unitPrice: 1000,
        location: "A-01-001",
        storageDate: "2024-02-15"
      },
      {
        itemCode: "ITEM002",
        itemName: "建材B",
        warehouseCode: "WH001",
        category: "B",
        theoreticalQuantity: 50,
        unitPrice: 1500,
        location: "B-02-002",
        storageDate: "2024-02-20"
      },
      {
        itemCode: "ITEM003",
        itemName: "建材C",
        warehouseCode: "WH001",
        category: "C",
        theoreticalQuantity: 200,
        unitPrice: 500,
        location: "C-03-003",
        storageDate: "2024-01-30"
      },
      {
        itemCode: "ITEM004",
        itemName: "建材D",
        warehouseCode: "WH001",
        category: "D",
        theoreticalQuantity: 80,
        unitPrice: 800,
        location: "D-04-004",
        storageDate: "2024-02-10"
      },
      {
        itemCode: "ITEM005",
        itemName: "建材E",
        warehouseCode: "WH002",
        category: "A",
        theoreticalQuantity: 150,
        unitPrice: 2000,
        location: "A-05-005",
        storageDate: "2024-02-25"
      },
      {
        itemCode: "ITEM006",
        itemName: "建材F",
        warehouseCode: "WH001",
        category: "A",
        theoreticalQuantity: 10,
        unitPrice: 200,
        location: "A-06-006",
        storageDate: "2024-02-28"
      }
    ];

    const result = extractInventoryItemsForStocktaking(
      stocktakingDate,
      warehouseCode,
      itemCategoryFilter,
      minimumValueThreshold,
      allInventoryItems
    );

    expect(result.totalItemCount).toBe(3);
    expect(result.items).toHaveLength(3);
    expect(result.totalInventoryValue).toBe(275000);

    expect(result.items[0].itemCode).toBe("ITEM001");
    expect(result.items[0].itemName).toBe("建材A");
    expect(result.items[0].theoreticalQuantity).toBe(100);
    expect(result.items[0].location).toBe("A-01-001");
    expect(result.items[0].inventoryValue).toBe(100000);

    expect(result.items[1].itemCode).toBe("ITEM002");
    expect(result.items[1].itemName).toBe("建材B");
    expect(result.items[1].theoreticalQuantity).toBe(50);
    expect(result.items[1].location).toBe("B-02-002");
    expect(result.items[1].inventoryValue).toBe(75000);

    expect(result.items[2].itemCode).toBe("ITEM003");
    expect(result.items[2].itemName).toBe("建材C");
    expect(result.items[2].theoreticalQuantity).toBe(200);
    expect(result.items[2].location).toBe("C-03-003");
    expect(result.items[2].inventoryValue).toBe(100000);

    expect(() => extractInventoryItemsForStocktaking(
      new Date("2024-04-01"),
      warehouseCode,
      itemCategoryFilter,
      minimumValueThreshold,
      allInventoryItems
    )).toThrow(/棚卸実施日/);

    expect(() => extractInventoryItemsForStocktaking(
      stocktakingDate,
      "",
      itemCategoryFilter,
      minimumValueThreshold,
      allInventoryItems
    )).toThrow(/倉庫コード/);

    expect(() => extractInventoryItemsForStocktaking(
      stocktakingDate,
      warehouseCode,
      itemCategoryFilter,
      -1000,
      allInventoryItems
    )).toThrow(/最小在庫金額/);
  });
});
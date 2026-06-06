import { extractInventoryItemsForStocktaking } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("棚卸対象品目が存在しない条件で空リストが正常に出力される", () => {
    // SCEN-437
    const stocktakingDate = new Date("2024-01-15");
    const warehouseCode = "WH999"; // 存在しない倉庫コード
    const itemCategoryFilter = ["NONEXISTENT_CATEGORY"]; // 存在しない品目カテゴリ
    const minimumValueThreshold = 1000;
    const allInventoryItems = [
      {
        itemCode: "ITEM001",
        itemName: "テスト品目1",
        warehouseCode: "WH001",
        category: "BUILDING_MATERIALS",
        theoreticalQuantity: 100,
        unitPrice: 500
      },
      {
        itemCode: "ITEM002", 
        itemName: "テスト品目2",
        warehouseCode: "WH001",
        category: "TOOLS",
        theoreticalQuantity: 50,
        unitPrice: 2000
      }
    ];

    const result = extractInventoryItemsForStocktaking(
      stocktakingDate,
      warehouseCode,
      itemCategoryFilter,
      minimumValueThreshold,
      allInventoryItems
    );

    expect(result.items).toEqual([]);
    expect(result.totalItemCount).toBe(0);
    expect(result.totalInventoryValue).toBe(0);
  });
});
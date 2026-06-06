import { extractInventoryItemsForStocktaking } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("必須項目が不足している品目データでエラーが発生する", () => {
    // SCEN-439
    const stocktakingDate = new Date("2024-01-15");
    const warehouseCode = "WH001";
    const itemCategoryFilter = ["材料", "製品"];
    const minimumValueThreshold = 10000;
    
    // 必須項目が不足している品目データを含む在庫品目データ
    const allInventoryItems = [
      {
        itemCode: "ITEM001",
        itemName: "正常品目",
        warehouseCode: "WH001",
        category: "材料",
        theoreticalQuantity: 100,
        unitPrice: 500
      },
      {
        itemCode: "",  // 品目コードが不足
        itemName: "品目コード不足",
        warehouseCode: "WH001",
        category: "材料",
        theoreticalQuantity: 50,
        unitPrice: 300
      },
      {
        itemCode: "ITEM003",
        itemName: "",  // 品目名が不足
        warehouseCode: "WH001",
        category: "製品",
        theoreticalQuantity: 75,
        unitPrice: 800
      },
      {
        itemCode: "ITEM004",
        itemName: "在庫数量不足",
        warehouseCode: "WH001",
        category: "材料",
        theoreticalQuantity: null,  // 在庫数量が不足
        unitPrice: 400
      }
    ];

    expect(() => extractInventoryItemsForStocktaking(
      stocktakingDate,
      warehouseCode,
      itemCategoryFilter,
      minimumValueThreshold,
      allInventoryItems
    )).toThrow(/必須項目/);
  });
});
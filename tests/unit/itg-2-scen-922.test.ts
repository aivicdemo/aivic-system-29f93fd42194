import { mapPricebookItemToEstimateItemHierarchy } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-922
  test("見積書項目体系に存在しない物価本項目に対してマッピング不可エラーが発生する", () => {
    const estimateItemHierarchy = {
      itemId: "EST-001",
      itemName: "基礎工事",
      children: [
        {
          itemId: "EST-001-001",
          itemName: "掘削工",
          unitPrice: 5000,
        },
        {
          itemId: "EST-001-002",
          itemName: "地盤改良",
          unitPrice: 8000,
        },
      ],
    };

    const pricebookItem = {
      pricebookItemId: "PB-999-999",
      itemName: "存在しない項目",
      standardPrice: 12000,
    };

    expect(() =>
      mapPricebookItemToEstimateItemHierarchy(
        estimateItemHierarchy,
        pricebookItem
      )
    ).toThrow(/該当する物価本項目が見積書項目体系に存在しません/);
  });
});
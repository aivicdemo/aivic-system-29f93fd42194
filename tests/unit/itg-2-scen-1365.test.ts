import { detectFormatDifference } from "../../src/logic/it-6-3-1";

describe("他部署フォーマット判定ロジック適用試験機能", () => {
  test("SCEN-1365: 入力見積書がnullの場合に入力値検証エラーを返す", () => {
    const inputEstimate = null;
    const baseFormatSpec = {
      itemId: "ITEM_001",
      itemName: "工事費",
      unitPrice: 10000,
      quantity: 5,
    };

    expect(() =>
      detectFormatDifference(inputEstimate, baseFormatSpec)
    ).toThrow(/見積書/);
  });
});
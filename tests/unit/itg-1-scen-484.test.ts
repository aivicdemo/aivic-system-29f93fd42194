const { analyzeInventoryVariance } = require("../../src/logic/it-1780551301636-1-2-1");

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("差異判定基準値ちょうどの差異が要調査対象として判定される", () => {
    // SCEN-484
    const itemCode = "ITEM001";
    const theoreticalQuantity = 10;
    const actualQuantity = 20;
    const unitPrice = 100;
    const itemCategory = "製品";

    const result = analyzeInventoryVariance(
      actualQuantity,
      theoreticalQuantity,
      unitPrice,
      itemCategory
    );

    expect(result.varianceAmount).toBe(1000);
    expect(result.severityLevel).toBe("注意");
    expect(result.investigationPriority).toBe("中");
    expect(result.actionRequired).toBe("週内調査");
  });
});
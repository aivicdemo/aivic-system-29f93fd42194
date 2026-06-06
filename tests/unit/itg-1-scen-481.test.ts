import { analyzeInventoryVariance } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("大きな差異が発見された場合に要調査対象として判定される", () => {
    // SCEN-481
    const systemQuantity = 100;
    const physicalQuantity = 80;
    const unitPrice = 1000;
    const itemCategory = "製品";

    const result = analyzeInventoryVariance(
      physicalQuantity,
      systemQuantity,
      unitPrice,
      itemCategory
    );

    expect(result.varianceAmount).toBe(-20000);
    expect(result.severityLevel).toBe("重大");
    expect(result.investigationPriority).toBe("高");
    expect(result.actionRequired).toBe("即座調査");
  });
});
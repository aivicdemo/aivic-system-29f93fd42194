import { analyzeInventoryVariance } from '../../src/logic/it-1780551301636-1-2-1';

describe("棚卸差異調査判定機能", () => {
  test("差異が許容範囲内の場合に調査不要と判定される", () => {
    // SCEN-482
    const theoreticalQuantity = 100;
    const physicalQuantity = 102;
    const unitPrice = 1000;
    const itemCategory = "製品";

    const result = analyzeInventoryVariance(
      physicalQuantity,
      theoreticalQuantity,
      unitPrice,
      itemCategory
    );

    expect(result.requiresInvestigation).toBe(false);
    expect(result.priority).toBe("none");
    expect(result.discrepancyAmount).toBe(2000);
    expect(result.discrepancyPercentage).toBe(2);
  });
});
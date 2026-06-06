import { validateDeliveryFeasibility } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("十分な在庫と製造能力がある場合に納期実現可能と判定される", () => {
    // SCEN-341
    const productSpecification = "標準製品A 寸法200x300 材質ステンレス";
    const requestedDeliveryDate = new Date("2024-02-15");
    const currentInventory = 150;
    const productionCapacity = 50;
    const requiredQuantity = 100;

    const result = validateDeliveryFeasibility(
      requestedDeliveryDate,
      productSpecification,
      currentInventory,
      productionCapacity,
      requiredQuantity
    );

    expect(result.feasible).toBe(true);
    expect(result.earliestDeliveryDate).toEqual(new Date("2024-02-15"));
    expect(result.shortfallQuantity).toBe(0);
    expect(result.requiredAdditionalDays).toBe(0);
  });
});
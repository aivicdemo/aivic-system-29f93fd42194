import { calculateRequiredMaterialQuantities } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("製品数量が0の場合に全資材の必要数量が0として計算される", () => {
    // SCEN-351
    const productCode = "PRODUCT-001";
    const productionQuantity = 0;
    const bomData = [
      { materialCode: "MAT-001", unitQuantity: 10, unit: "個" },
      { materialCode: "MAT-002", unitQuantity: 5, unit: "kg" },
      { materialCode: "MAT-003", unitQuantity: 2.5, unit: "m" }
    ];

    const result = calculateRequiredMaterialQuantities(
      productCode,
      productionQuantity,
      bomData
    );

    expect(result).toEqual([
      { materialCode: "MAT-001", requiredQuantity: 0, unit: "個" },
      { materialCode: "MAT-002", requiredQuantity: 0, unit: "kg" },
      { materialCode: "MAT-003", requiredQuantity: 0, unit: "m" }
    ]);
  });
});
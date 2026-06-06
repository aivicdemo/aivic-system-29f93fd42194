import { calculateRequiredMaterialQuantities } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("資材必要数量計算機能 - 製品数量が負の値の場合にエラーが発生する", () => {
    // SCEN-353
    const productCode = "PROD001";
    const productionQuantity = -10;
    const bomData = [
      { materialCode: "MAT001", unitQuantity: 2.5, unit: "kg" },
      { materialCode: "MAT002", unitQuantity: 1.0, unit: "個" }
    ];

    expect(() => calculateRequiredMaterialQuantities(productCode, productionQuantity, bomData))
      .toThrow(/製品数量/);
  });
});
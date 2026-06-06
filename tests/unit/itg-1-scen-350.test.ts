import { calculateRequiredMaterialQuantities } from '../../src/logic/it-1';

describe("資材必要数量計算機能", () => {
  test("SCEN-350: 製品数量と部品構成表から各資材の必要数量が正確に計算される", () => {
    // 製品コード「PROD001」で生産数量100個
    const productCode = "PROD001";
    const productionQuantity = 100;
    
    // 部品構成表データ（BOM）- 製品1個あたりの必要数量
    const bomData = [
      {
        materialCode: "MAT001",
        unitQuantity: 2.5,
        unit: "kg"
      },
      {
        materialCode: "MAT002", 
        unitQuantity: 1,
        unit: "個"
      },
      {
        materialCode: "MAT003",
        unitQuantity: 0.8,
        unit: "m"
      }
    ];

    const result = calculateRequiredMaterialQuantities(productCode, productionQuantity, bomData);

    // 期待結果: 製品数量 × BOMの構成数量で算出
    // MAT001: 100 × 2.5 = 250kg
    // MAT002: 100 × 1 = 100個  
    // MAT003: 100 × 0.8 = 80m
    expect(result).toEqual([
      {
        materialCode: "MAT001",
        requiredQuantity: 250,
        unit: "kg"
      },
      {
        materialCode: "MAT002",
        requiredQuantity: 100,
        unit: "個"
      },
      {
        materialCode: "MAT003",
        requiredQuantity: 80,
        unit: "m"
      }
    ]);

    // 結果の配列長も検証
    expect(result).toHaveLength(3);

    // 各材料の必要数量が正の値であることを確認
    result.forEach(item => {
      expect(item.requiredQuantity).toBeGreaterThan(0);
    });
  });
});
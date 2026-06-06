import { calculateRequiredMaterialQuantities } from '../../src/logic/it-1';

describe('製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能', () => {
  test('部品構成表が空の場合にエラーが発生する', () => {
    // SCEN-352
    const productCode = 'PROD001';
    const productionQuantity = 100;
    const bomData = [];

    expect(() => 
      calculateRequiredMaterialQuantities(productCode, productionQuantity, bomData)
    ).toThrow(/部品構成表/);
  });
});
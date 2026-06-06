import { integrateProductionData } from '../../src/logic/it-1';

describe('製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能', () => {
  test('統合対象となる実績データが存在しない場合にエラーが返される', () => {
    // SCEN-487
    const productionData = [];
    const inventoryData = [];
    const reportingPeriod = { startDate: "2024-01-01", endDate: "2024-01-31" };

    expect(() => integrateProductionData(productionData, inventoryData, reportingPeriod))
      .toThrow(/実績データ/);
  });
});
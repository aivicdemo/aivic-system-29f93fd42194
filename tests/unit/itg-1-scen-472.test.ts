import { setProductionDataExtractionPeriod } from '../../src/logic/it-1';

describe('製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能', () => {
  test('SCEN-472: 存在しない対象期間を指定した場合にエラーが返される', () => {
    // SCEN-472
    const reportingMonth = '2024-13';
    const currentDate = new Date('2024-01-15T10:00:00Z');
    const fiscalYearStartMonth = 4;

    expect(() => {
      setProductionDataExtractionPeriod(
        reportingMonth,
        currentDate,
        fiscalYearStartMonth
      );
    }).toThrow(/期間/);
  });
});
import { detectSalesDataQualityAnomalies } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質異常検出・補正指示生成機能', () => {
  // SCEN-637
  test('月次営業データが空の場合、エラーが発生する', () => {
    const emptySalesData = [];

    expect(() => {
      detectSalesDataQualityAnomalies(emptySalesData);
    }).toThrow(/営業データ/);
  });
});
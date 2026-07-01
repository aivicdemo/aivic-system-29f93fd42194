import { detectAnomalousValues } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの異常値・漏れ検出', () => {
  // SCEN-640: [error] 営業データ異常値・漏れ検出機能 - 売上金額が負の値の場合に異常値として検出される
  test('売上金額が負の値の場合に異常値として検出される', () => {
    const testData = {
      salesAmount: -10000,
      customerId: 'CUST001',
      serviceType: 'BASIC',
      transactionDate: '2024-01-15',
    };

    const result = detectAnomalousValues(testData);

    expect(result.isAnomalous).toBe(true);
    expect(result.anomalyFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'salesAmount',
          detectedValue: -10000,
          reason: '売上金額が負の値です',
          errorCode: 'NEGATIVE_SALES_AMOUNT',
        }),
      ])
    );
    expect(result.anomalyFlags).toHaveLength(1);
    expect(result.anomalyLog).toContain('売上金額');
    expect(result.anomalyLog).toContain('-10000');
  });
});
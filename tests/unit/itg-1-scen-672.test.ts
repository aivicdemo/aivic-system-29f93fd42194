import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質自動検証機能 - 金額異常値検出', () => {
  test('SCEN-672: 負数・過度に大きい金額値の異常値が正確に検出される', () => {
    // ハッピーパス: 正常な金額値
    const validSalesData = {
      recordId: 'REC001',
      customerId: 'CUST001',
      amount: 50000,
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'standard',
      recordDate: '2024-01-15'
    };

    const validResult = validateSalesData(validSalesData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);

    // 異常値テスト1: 負数金額
    const negativeAmountData = {
      recordId: 'REC002',
      customerId: 'CUST001',
      amount: -10000,
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'standard',
      recordDate: '2024-01-15'
    };

    const negativeResult = validateSalesData(negativeAmountData);
    expect(negativeResult.isValid).toBe(false);
    expect(negativeResult.errors.length).toBeGreaterThan(0);
    expect(negativeResult.errors[0]).toEqual(
      expect.objectContaining({
        fieldName: 'amount',
        errorType: 'abnormalValue',
        value: -10000,
        message: expect.stringMatching(/負数/)
      })
    );

    // 異常値テスト2: 過度に大きい金額
    const excessiveAmountData = {
      recordId: 'REC003',
      customerId: 'CUST001',
      amount: 999999999999,
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'standard',
      recordDate: '2024-01-15'
    };

    const excessiveResult = validateSalesData(excessiveAmountData);
    expect(excessiveResult.isValid).toBe(false);
    expect(excessiveResult.errors.length).toBeGreaterThan(0);
    expect(excessiveResult.errors[0]).toEqual(
      expect.objectContaining({
        fieldName: 'amount',
        errorType: 'abnormalValue',
        value: 999999999999,
        message: expect.stringMatching(/上限/)
      })
    );

    // 複合検証: 負数と過度な大きさの両方が含まれる場合
    const multipleAnomaliesData = {
      recordId: 'REC004',
      customerId: 'CUST001',
      amount: -50000,
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'standard',
      recordDate: '2024-01-15'
    };

    const multipleResult = validateSalesData(multipleAnomaliesData);
    expect(multipleResult.isValid).toBe(false);
    expect(multipleResult.errors.length).toBeGreaterThan(0);

    // 異常値が検証結果レポートに記録されていることを確認
    expect(multipleResult.report).toEqual(
      expect.objectContaining({
        recordId: 'REC004',
        timestamp: expect.any(String),
        validationStatus: 'FAILED',
        anomaliesDetected: expect.arrayContaining([
          expect.objectContaining({
            fieldName: 'amount',
            detectedValue: -50000
          })
        ])
      })
    );

    // 境界値テスト: 許容範囲の最大値
    const maxBoundaryData = {
      recordId: 'REC005',
      customerId: 'CUST001',
      amount: 10000000,
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'standard',
      recordDate: '2024-01-15'
    };

    const maxBoundaryResult = validateSalesData(maxBoundaryData);
    expect(maxBoundaryResult.isValid).toBe(true);
    expect(maxBoundaryResult.errors).toEqual([]);

    // 境界値テスト: 最小許容値（0円）
    const zeroAmountData = {
      recordId: 'REC006',
      customerId: 'CUST001',
      amount: 0,
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'standard',
      recordDate: '2024-01-15'
    };

    const zeroResult = validateSalesData(zeroAmountData);
    expect(zeroResult.isValid).toBe(true);
    expect(zeroResult.errors).toEqual([]);

    // 正常値は検出対象とならないことを確認
    const allValidData = [
      { amount: 1 },
      { amount: 100 },
      { amount: 50000 },
      { amount: 1000000 },
      { amount: 10000000 }
    ];

    allValidData.forEach(data => {
      const testData = {
        recordId: 'REC007',
        customerId: 'CUST001',
        appointmentCount: 5,
        contractCount: 2,
        serviceType: 'standard',
        recordDate: '2024-01-15',
        ...data
      };
      const result = validateSalesData(testData);
      expect(result.isValid).toBe(true);
    });
  });
});
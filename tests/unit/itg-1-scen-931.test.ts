import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証ルール適用 - 金額異常値の閾値境界値判定', () => {
  // SCEN-931: [edge] 営業データ品質検証ルール適用 - 金額異常値の閾値境界値（±20%丁度）が正確に判定される
  test('基準金額1,000,000円に対して±20%境界値が正確に判定される', () => {
    const baseAmount = 1000000;
    const toleranceRate = 0.2;
    const lowerBound = baseAmount * (1 - toleranceRate);
    const upperBound = baseAmount * (1 + toleranceRate);

    // テストケース: ±20%丁度の境界値（正常範囲内）
    const resultAtUpperBound = validateSalesDataQuality({
      transactionId: 'TXN-001',
      customerId: 'CUST-001',
      amount: 1200000,
      baseAmount: baseAmount,
      tolerancePercentage: 20,
    });
    expect(resultAtUpperBound.isValid).toBe(true);
    expect(resultAtUpperBound.statusCode).toBe('VALID');

    const resultAtLowerBound = validateSalesDataQuality({
      transactionId: 'TXN-002',
      customerId: 'CUST-001',
      amount: 800000,
      baseAmount: baseAmount,
      tolerancePercentage: 20,
    });
    expect(resultAtLowerBound.isValid).toBe(true);
    expect(resultAtLowerBound.statusCode).toBe('VALID');

    // テストケース: ±20%を超える値（異常値）
    const resultAboveUpperBound = validateSalesDataQuality({
      transactionId: 'TXN-003',
      customerId: 'CUST-001',
      amount: 1200100,
      baseAmount: baseAmount,
      tolerancePercentage: 20,
    });
    expect(resultAboveUpperBound.isValid).toBe(false);
    expect(resultAboveUpperBound.statusCode).toBe('ANOMALY_DETECTED');
    expect(resultAboveUpperBound.deviationPercentage).toBeCloseTo(20.01, 2);

    const resultBelowLowerBound = validateSalesDataQuality({
      transactionId: 'TXN-004',
      customerId: 'CUST-001',
      amount: 799900,
      baseAmount: baseAmount,
      tolerancePercentage: 20,
    });
    expect(resultBelowLowerBound.isValid).toBe(false);
    expect(resultBelowLowerBound.statusCode).toBe('ANOMALY_DETECTED');
    expect(resultBelowLowerBound.deviationPercentage).toBeCloseTo(-20.01, 2);

    // 検証ログの確認
    expect(resultAtUpperBound.validationLog).toContain('金額');
    expect(resultAboveUpperBound.validationLog).toContain('異常値');
  });
});
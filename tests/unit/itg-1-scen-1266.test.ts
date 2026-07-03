import { calculateBillingAmountByCustomerService } from '../../src/logic/it-1-2-1';

describe('顧客別・サービス別請求額計算機能', () => {
  // SCEN-1266
  test('最小請求額以下の計算結果が最小請求額に調整される', () => {
    // Arrange
    const input = {
      customerId: 'CUST-001',
      serviceItems: [
        {
          serviceId: 'SVC-A',
          usageQuantity: 2,
          unitPrice: 15000,
          minimumBillingAmount: 50000,
        },
        {
          serviceId: 'SVC-B',
          usageQuantity: 1,
          unitPrice: 10000,
          minimumBillingAmount: 30000,
        },
      ],
    };

    // Act
    const result = calculateBillingAmountByCustomerService(input);

    // Assert
    // サービスA: 2 * 15000 = 30,000 < 50,000(最小請求額) → 50,000に調整
    expect(result.serviceBreakdown[0]).toEqual({
      serviceId: 'SVC-A',
      calculatedAmount: 30000,
      minimumBillingAmount: 50000,
      appliedAmount: 50000,
    });

    // サービスB: 1 * 10000 = 10,000 < 30,000(最小請求額) → 30,000に調整
    expect(result.serviceBreakdown[1]).toEqual({
      serviceId: 'SVC-B',
      calculatedAmount: 10000,
      minimumBillingAmount: 30000,
      appliedAmount: 30000,
    });

    // 顧客全体の請求額: 50,000 + 30,000 = 80,000
    expect(result.totalBillingAmount).toBe(80000);
    expect(result.customerId).toBe('CUST-001');
    expect(result.adjustmentApplied).toBe(true);
  });
});
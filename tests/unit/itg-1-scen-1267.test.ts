import { calculateBillingAmountByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('顧客別・サービス別請求額計算機能', () => {
  // SCEN-1267: [edge] 請求額が上限を超過した場合、上限値に補正される
  test('請求額の合計が上限値を超過した場合、システムが自動的に請求額を上限値に補正し、最終的な請求額が正確に上限値となり、補正フラグが記録されること', () => {
    const customerId = 'CUST001';
    const billingCap = 100000;
    const serviceCharges = [
      {
        serviceType: 'SERVICE_A',
        amount: 60000,
      },
      {
        serviceType: 'SERVICE_B',
        amount: 90000,
      },
    ];

    const result = calculateBillingAmountByCustomerAndService({
      customerId,
      billingCap,
      serviceCharges,
    });

    expect(result.finalBillingAmount).toBe(100000);
    expect(result.originalAmount).toBe(150000);
    expect(result.isCapped).toBe(true);
    expect(result.capApplied).toBe(true);
    expect(result.adjustmentLog).toBeDefined();
    expect(result.adjustmentLog.capThreshold).toBe(100000);
    expect(result.adjustmentLog.excessAmount).toBe(50000);
  });
});
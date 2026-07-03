import { validateContractChangeCompliance } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1210
  test('契約変更内容がすべてのルール要件を満たす場合、承認可と判定される', () => {
    const contractChangeInput = {
      contractId: 'CNT-00001',
      customerId: 'CUST-12345',
      serviceId: 'SVC-001',
      changeType: 'amount_adjustment',
      previousAmount: 500000,
      newAmount: 600000,
      billingCycle: 'monthly',
      billingAmount: 50000,
      newDeliveryDate: new Date('2025-03-31T23:59:59Z'),
      leadTimeDays: 30,
      changeDescription: 'Service expansion with increased scope',
      effectiveDate: new Date('2025-02-01T00:00:00Z'),
    };

    const contractRules = {
      minContractAmount: 100000,
      maxContractAmount: 10000000,
      minContractDurationMonths: 12,
      allowedBillingCycles: ['monthly', 'quarterly', 'annual'],
      minBillingAmount: 10000,
      maxBillingAmount: 500000,
    };

    const billingRules = {
      minBillingInterval: 30,
      maxBillingDelayDays: 5,
      allowedBillingIntervals: [30, 90, 365],
    };

    const deliveryRules = {
      minLeadTimeDays: 14,
      maxDeliveryDaysFromNow: 365,
      allowedDeliveryWeekdays: [1, 2, 3, 4, 5],
    };

    const result = validateContractChangeCompliance({
      contractChange: contractChangeInput,
      contractRules,
      billingRules,
      deliveryRules,
    });

    expect(result).toEqual({
      isApproved: true,
      complianceStatus: 'approved',
      ruleCheckResults: {
        contractRulesCompliant: true,
        billingRulesCompliant: true,
        deliveryRulesCompliant: true,
      },
      violations: [],
      message: '契約変更内容はすべてのルール要件を満たしています。承認可能です。',
    });

    expect(result.isApproved).toBe(true);
    expect(result.complianceStatus).toBe('approved');
    expect(result.violations.length).toBe(0);
  });
});
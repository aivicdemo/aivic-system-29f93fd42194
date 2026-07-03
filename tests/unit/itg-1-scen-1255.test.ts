import { describe, test, expect } from '@jest/globals';
import { extractAndAggregateBillingItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1255
  test('請求対象項目が存在しない営業データに対して、ゼロ集計結果を返して次工程へ進める', () => {
    const salesData = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A01',
      period: '2024-01',
      appointmentCount: 0,
      contractCount: 0,
      customerReaction: '',
      otherMetric: null,
    };

    const contractRules = {
      serviceId: 'SVC-A01',
      billingTargetFields: ['appointmentCount', 'contractCount'],
      unitPrice: 10000,
      discountRate: 0,
    };

    const result = extractAndAggregateBillingItems({
      salesData,
      contractRules,
    });

    expect(result).toEqual({
      customerId: 'CUST-001',
      serviceId: 'SVC-A01',
      period: '2024-01',
      appointmentCount: 0,
      contractCount: 0,
      totalBillingAmount: 0,
      itemsAggregated: {},
      status: 'completed',
      errorMessage: null,
    });

    expect(result.status).toBe('completed');
    expect(result.errorMessage).toBeNull();
    expect(result.totalBillingAmount).toBe(0);
    expect(typeof result.itemsAggregated).toBe('object');
  });
});
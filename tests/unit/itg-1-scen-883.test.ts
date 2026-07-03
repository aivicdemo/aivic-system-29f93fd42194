import { applyBillingRule } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-883: [error] 請求ルール適用ロジック機能 - 指定された顧客・サービスに対する請求ルールが存在しない場合にエラーが返される
  test('should return error when billing rule not found for specified customer and service', () => {
    const customerId = 'CUST-NOT-EXISTS-999';
    const serviceId = 'SVC-NOT-EXISTS-999';
    const billingRules = [
      {
        customerId: 'CUST-001',
        serviceId: 'SVC-001',
        unitPrice: 10000,
        discountRate: 0.1,
      },
      {
        customerId: 'CUST-002',
        serviceId: 'SVC-002',
        unitPrice: 15000,
        discountRate: 0.05,
      },
    ];

    expect(() => {
      applyBillingRule({
        customerId,
        serviceId,
        billingRules,
      });
    }).toThrow(/請求ルール/);
  });
});
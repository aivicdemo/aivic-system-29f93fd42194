import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-950: [edge] 契約ごとの請求額計算 - 成果報酬が0の場合、基本料金から割引額を差し引いた金額が請求額となる
  test('成果報酬が0円の場合、請求額は基本料金から割引額を差し引いた金額となること', () => {
    const contractData = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      basicFeeYen: 10000,
      performanceRewardYen: 0,
      discountYen: 2000,
    };

    const result = calculateBillingAmount(contractData);

    expect(result).toEqual({
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      billingAmountYen: 8000,
      basicFeeYen: 10000,
      performanceRewardYen: 0,
      discountYen: 2000,
    });
    expect(result.billingAmountYen).toBe(8000);
  });
});
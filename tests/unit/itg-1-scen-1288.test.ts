import { extractBillingItemsAndCalculateAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1288: [edge] 契約内容・割引基準との照合機能 - 割引率が 0% の場合に割引非適用と判定される
  test('割引率が0%の場合、割引を非適用と判定し、請求金額が元の金額のままとなる', () => {
    const salesData = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      appointmentCount: 5,
      contractCount: 3,
      basePricePerAppointment: 10000,
      basePricePerContract: 20000,
    };

    const contractTerms = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      discountRate: 0,
      discountType: 'percentage',
      minimumBillingAmount: 0,
      maximumBillingAmount: 999999,
    };

    const result = extractBillingItemsAndCalculateAmount(salesData, contractTerms);

    // 基本請求額: (5 * 10000) + (3 * 20000) = 50000 + 60000 = 110000
    const expectedBaseAmount = 110000;
    // 割引率 0% の場合、割引額 = 0
    const expectedDiscountAmount = 0;
    // 最終請求額 = 110000 - 0 = 110000
    const expectedFinalAmount = 110000;

    expect(result.baseAmount).toBe(expectedBaseAmount);
    expect(result.discountAmount).toBe(expectedDiscountAmount);
    expect(result.finalAmount).toBe(expectedFinalAmount);
    expect(result.discountApplied).toBe(false);
    expect(result.discountRateApplied).toBe(0);
  });
});
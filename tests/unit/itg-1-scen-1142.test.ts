import { calculateBillingAmountByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1142
  test('請求額自動計算・集計機能 - 顧客ごと・サービスごとに請求額が正確に集計される', () => {
    const salesData = [
      {
        customerId: 'CUST_A',
        serviceId: 'SVC_1',
        appointmentCount: 10,
        contractCount: 3,
        unitPrice: 5000,
        discountRate: 0.1,
      },
      {
        customerId: 'CUST_A',
        serviceId: 'SVC_2',
        appointmentCount: 5,
        contractCount: 2,
        unitPrice: 8000,
        discountRate: 0.05,
      },
      {
        customerId: 'CUST_B',
        serviceId: 'SVC_1',
        appointmentCount: 8,
        contractCount: 2,
        unitPrice: 5000,
        discountRate: 0.0,
      },
    ];

    const masterPricingRules = {
      CUST_A_SVC_1: {
        baseUnitPrice: 5000,
        discountRate: 0.1,
        minimumBillingAmount: 30000,
      },
      CUST_A_SVC_2: {
        baseUnitPrice: 8000,
        discountRate: 0.05,
        minimumBillingAmount: 50000,
      },
      CUST_B_SVC_1: {
        baseUnitPrice: 5000,
        discountRate: 0.0,
        minimumBillingAmount: 0,
      },
    };

    const result = calculateBillingAmountByCustomerAndService(
      salesData,
      masterPricingRules
    );

    // 顧客A・サービス1の請求額確認
    // 計算: (10 * 5000) * (1 - 0.1) = 45000
    expect(result.byCustomerAndService['CUST_A_SVC_1']).toBe(45000);

    // 顧客A・サービス2の請求額確認
    // 計算: (5 * 8000) * (1 - 0.05) = 38000、最小請求額50000適用 -> 50000
    expect(result.byCustomerAndService['CUST_A_SVC_2']).toBe(50000);

    // 顧客B・サービス1の請求額確認
    // 計算: (8 * 5000) * (1 - 0.0) = 40000
    expect(result.byCustomerAndService['CUST_B_SVC_1']).toBe(40000);

    // 顧客ごとの合計請求額確認
    // 顧客A: 45000 + 50000 = 95000
    expect(result.byCustomer['CUST_A']).toBe(95000);
    // 顧客B: 40000
    expect(result.byCustomer['CUST_B']).toBe(40000);

    // サービスごとの合計請求額確認
    // サービス1: 45000 + 40000 = 85000
    expect(result.byService['SVC_1']).toBe(85000);
    // サービス2: 50000
    expect(result.byService['SVC_2']).toBe(50000);

    // 全体の合計請求額確認
    // 95000 + 40000 = 135000
    expect(result.totalBillingAmount).toBe(135000);

    // マスターデータの料金体系と照合
    expect(result.validationStatus).toBe('valid');

    // 集計結果がデータベースに正確に保存されていることを確認
    expect(result.saved).toBe(true);
    expect(result.recordCount).toBe(3);
  });
});
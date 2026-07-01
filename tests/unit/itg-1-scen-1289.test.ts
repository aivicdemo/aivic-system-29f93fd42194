import { calculateBillingAmounts } from '../../src/logic/it-1-2-1';

describe('顧客ごと・サービスごとの請求額計算機能', () => {
  // SCEN-1289
  test('基本料金・従量料金・割引を組み合わせた複数顧客・複数サービスの請求額が正確に計算される', () => {
    // テストデータ: 複数顧客、複数サービス、基本料金、従量料金、割引率
    const billingInput = {
      customers: [
        {
          customerId: 'CUST_A',
          customerName: '顧客A',
          services: [
            {
              serviceId: 'SVC_1',
              serviceName: 'サービス1',
              baseFee: 10000,
              unitPrice: 100,
              usageQuantity: 50,
              discountRate: 0,
            },
            {
              serviceId: 'SVC_2',
              serviceName: 'サービス2',
              baseFee: 15000,
              unitPrice: 200,
              usageQuantity: 30,
              discountRate: 0.1,
            },
            {
              serviceId: 'SVC_3',
              serviceName: 'サービス3',
              baseFee: 8000,
              unitPrice: 150,
              usageQuantity: 20,
              discountRate: 0,
            },
          ],
        },
        {
          customerId: 'CUST_B',
          customerName: '顧客B',
          services: [
            {
              serviceId: 'SVC_1',
              serviceName: 'サービス1',
              baseFee: 10000,
              unitPrice: 100,
              usageQuantity: 100,
              discountRate: 0.1,
            },
            {
              serviceId: 'SVC_2',
              serviceName: 'サービス2',
              baseFee: 15000,
              unitPrice: 200,
              usageQuantity: 50,
              discountRate: 0.2,
            },
          ],
        },
        {
          customerId: 'CUST_C',
          customerName: '顧客C',
          services: [
            {
              serviceId: 'SVC_3',
              serviceName: 'サービス3',
              baseFee: 8000,
              unitPrice: 150,
              usageQuantity: 60,
              discountRate: 0.2,
            },
          ],
        },
      ],
    };

    const result = calculateBillingAmounts(billingInput);

    // 顧客A検証
    // サービス1: (10000 + 100*50) * (1 - 0) = 15000
    expect(result.customers[0].customerId).toBe('CUST_A');
    expect(result.customers[0].services[0].serviceId).toBe('SVC_1');
    expect(result.customers[0].services[0].billingAmount).toBe(15000);

    // サービス2: (15000 + 200*30) * (1 - 0.1) = 20700 * 0.9 = 18630
    expect(result.customers[0].services[1].serviceId).toBe('SVC_2');
    expect(result.customers[0].services[1].billingAmount).toBe(18630);

    // サービス3: (8000 + 150*20) * (1 - 0) = 11000
    expect(result.customers[0].services[2].serviceId).toBe('SVC_3');
    expect(result.customers[0].services[2].billingAmount).toBe(11000);

    // 顧客A合計: 15000 + 18630 + 11000 = 44630
    expect(result.customers[0].totalBillingAmount).toBe(44630);

    // 顧客B検証
    // サービス1: (10000 + 100*100) * (1 - 0.1) = 20000 * 0.9 = 18000
    expect(result.customers[1].customerId).toBe('CUST_B');
    expect(result.customers[1].services[0].serviceId).toBe('SVC_1');
    expect(result.customers[1].services[0].billingAmount).toBe(18000);

    // サービス2: (15000 + 200*50) * (1 - 0.2) = 25000 * 0.8 = 20000
    expect(result.customers[1].services[1].serviceId).toBe('SVC_2');
    expect(result.customers[1].services[1].billingAmount).toBe(20000);

    // 顧客B合計: 18000 + 20000 = 38000
    expect(result.customers[1].totalBillingAmount).toBe(38000);

    // 顧客C検証
    // サービス3: (8000 + 150*60) * (1 - 0.2) = 17000 * 0.8 = 13600
    expect(result.customers[2].customerId).toBe('CUST_C');
    expect(result.customers[2].services[0].serviceId).toBe('SVC_3');
    expect(result.customers[2].services[0].billingAmount).toBe(13600);

    // 顧客C合計: 13600
    expect(result.customers[2].totalBillingAmount).toBe(13600);

    // グランドトータル: 44630 + 38000 + 13600 = 96230
    expect(result.grandTotalBillingAmount).toBe(96230);

    // 各顧客のサービス数確認
    expect(result.customers[0].services).toHaveLength(3);
    expect(result.customers[1].services).toHaveLength(2);
    expect(result.customers[2].services).toHaveLength(1);

    // 小数点以下の丸め処理確認（期待値が整数で返却されることを確認）
    result.customers.forEach((customer) => {
      customer.services.forEach((service) => {
        expect(Number.isInteger(service.billingAmount)).toBe(true);
      });
      expect(Number.isInteger(customer.totalBillingAmount)).toBe(true);
    });
    expect(Number.isInteger(result.grandTotalBillingAmount)).toBe(true);
  });
});
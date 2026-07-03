import { extractAndAggregateChargeableItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1360: 複数の顧客とサービスの組み合わせが存在する場合、請求額の集計が正確に分離される', () => {
    // Arrange: テストデータ構築
    const salesData = [
      {
        customerId: 'CUST_A',
        customerName: '顧客A',
        serviceId: 'SVC_1',
        serviceName: 'サービス1',
        amount: 100000,
        transactionDate: '2024-01-15',
      },
      {
        customerId: 'CUST_A',
        customerName: '顧客A',
        serviceId: 'SVC_2',
        serviceName: 'サービス2',
        amount: 50000,
        transactionDate: '2024-01-16',
      },
      {
        customerId: 'CUST_B',
        customerName: '顧客B',
        serviceId: 'SVC_1',
        serviceName: 'サービス1',
        amount: 75000,
        transactionDate: '2024-01-17',
      },
      {
        customerId: 'CUST_B',
        customerName: '顧客B',
        serviceId: 'SVC_3',
        serviceName: 'サービス3',
        amount: 30000,
        transactionDate: '2024-01-18',
      },
      {
        customerId: 'CUST_C',
        customerName: '顧客C',
        serviceId: 'SVC_2',
        serviceName: 'サービス2',
        amount: 60000,
        transactionDate: '2024-01-19',
      },
    ];

    // Act: 請求対象項目自動抽出・集計機能を実行
    const result = extractAndAggregateChargeableItems(salesData);

    // Assert: 結果の構造と値を検証
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // 顧客A の検証
    const customerA = result.find((item: any) => item.customerId === 'CUST_A');
    expect(customerA).toBeDefined();
    expect(customerA.customerName).toBe('顧客A');
    expect(customerA.totalAmount).toBe(150000);
    expect(Array.isArray(customerA.serviceBreakdown)).toBe(true);
    expect(customerA.serviceBreakdown.length).toBe(2);

    const custA_svc1 = customerA.serviceBreakdown.find((svc: any) => svc.serviceId === 'SVC_1');
    expect(custA_svc1).toBeDefined();
    expect(custA_svc1.serviceName).toBe('サービス1');
    expect(custA_svc1.amount).toBe(100000);

    const custA_svc2 = customerA.serviceBreakdown.find((svc: any) => svc.serviceId === 'SVC_2');
    expect(custA_svc2).toBeDefined();
    expect(custA_svc2.serviceName).toBe('サービス2');
    expect(custA_svc2.amount).toBe(50000);

    // 顧客B の検証
    const customerB = result.find((item: any) => item.customerId === 'CUST_B');
    expect(customerB).toBeDefined();
    expect(customerB.customerName).toBe('顧客B');
    expect(customerB.totalAmount).toBe(105000);
    expect(Array.isArray(customerB.serviceBreakdown)).toBe(true);
    expect(customerB.serviceBreakdown.length).toBe(2);

    const custB_svc1 = customerB.serviceBreakdown.find((svc: any) => svc.serviceId === 'SVC_1');
    expect(custB_svc1).toBeDefined();
    expect(custB_svc1.serviceName).toBe('サービス1');
    expect(custB_svc1.amount).toBe(75000);

    const custB_svc3 = customerB.serviceBreakdown.find((svc: any) => svc.serviceId === 'SVC_3');
    expect(custB_svc3).toBeDefined();
    expect(custB_svc3.serviceName).toBe('サービス3');
    expect(custB_svc3.amount).toBe(30000);

    // 顧客C の検証
    const customerC = result.find((item: any) => item.customerId === 'CUST_C');
    expect(customerC).toBeDefined();
    expect(customerC.customerName).toBe('顧客C');
    expect(customerC.totalAmount).toBe(60000);
    expect(Array.isArray(customerC.serviceBreakdown)).toBe(true);
    expect(customerC.serviceBreakdown.length).toBe(1);

    const custC_svc2 = customerC.serviceBreakdown.find((svc: any) => svc.serviceId === 'SVC_2');
    expect(custC_svc2).toBeDefined();
    expect(custC_svc2.serviceName).toBe('サービス2');
    expect(custC_svc2.amount).toBe(60000);

    // 全体検証: 顧客数が 3 で、重複や漏れがないこと
    expect(result.length).toBe(3);
    const allCustomerIds = result.map((item: any) => item.customerId).sort();
    expect(allCustomerIds).toEqual(['CUST_A', 'CUST_B', 'CUST_C']);
  });
});
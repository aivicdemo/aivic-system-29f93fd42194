import { extractBillingData } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-747: [normal] 月次請求書生成用データ出力 - 月次締め日に営業データから請求対象項目が自動判定・抽出され、顧客ごと・サービスごとの請求額が集計される
  test('月次締め日に営業データから請求対象項目が正確に自動判定・抽出され、顧客ごと・サービスごとに請求額が正しく集計される', () => {
    const cutoffDate = new Date('2024-01-31T00:00:00Z');
    
    const salesData = [
      {
        id: 'SALE-001',
        customerId: 'CUST-A',
        customerName: '顧客A',
        serviceId: 'SVC-001',
        serviceName: 'コンサルティング',
        quantity: 10,
        unitPrice: 50000,
        status: 'completed',
        transactionDate: new Date('2024-01-15T09:00:00Z'),
      },
      {
        id: 'SALE-002',
        customerId: 'CUST-A',
        customerName: '顧客A',
        serviceId: 'SVC-001',
        serviceName: 'コンサルティング',
        quantity: 5,
        unitPrice: 50000,
        status: 'completed',
        transactionDate: new Date('2024-01-20T10:00:00Z'),
      },
      {
        id: 'SALE-003',
        customerId: 'CUST-A',
        customerName: '顧客A',
        serviceId: 'SVC-002',
        serviceName: 'システム開発',
        quantity: 2,
        unitPrice: 300000,
        status: 'completed',
        transactionDate: new Date('2024-01-25T14:00:00Z'),
      },
      {
        id: 'SALE-004',
        customerId: 'CUST-B',
        customerName: '顧客B',
        serviceId: 'SVC-001',
        serviceName: 'コンサルティング',
        quantity: 8,
        unitPrice: 50000,
        status: 'completed',
        transactionDate: new Date('2024-01-10T11:00:00Z'),
      },
      {
        id: 'SALE-005',
        customerId: 'CUST-B',
        customerName: '顧客B',
        serviceId: 'SVC-002',
        serviceName: 'システム開発',
        quantity: 1,
        unitPrice: 300000,
        status: 'completed',
        transactionDate: new Date('2024-01-28T15:00:00Z'),
      },
      {
        id: 'SALE-006',
        customerId: 'CUST-A',
        customerName: '顧客A',
        serviceId: 'SVC-001',
        serviceName: 'コンサルティング',
        quantity: 3,
        unitPrice: 50000,
        status: 'cancelled',
        transactionDate: new Date('2024-01-22T09:00:00Z'),
      },
      {
        id: 'SALE-007',
        customerId: 'CUST-C',
        customerName: '顧客C',
        serviceId: 'SVC-001',
        serviceName: 'コンサルティング',
        quantity: 6,
        unitPrice: 50000,
        status: 'completed',
        transactionDate: new Date('2024-01-30T16:00:00Z'),
      },
    ];

    const taxRate = 0.10;

    const result = extractBillingData(salesData, cutoffDate, taxRate);

    // 構造の検証: customerGroups が存在し、配列である
    expect(Array.isArray(result.customerGroups)).toBe(true);
    expect(result.customerGroups.length).toBe(3);

    // 顧客Aのグループ検証
    const customerAGroup = result.customerGroups.find((g) => g.customerId === 'CUST-A');
    expect(customerAGroup).toBeDefined();
    expect(customerAGroup?.customerName).toBe('顧客A');
    expect(Array.isArray(customerAGroup?.services)).toBe(true);
    expect(customerAGroup?.services.length).toBe(2);

    // 顧客A - コンサルティング（SVC-001）の集計確認
    // 完了済み: 10 + 5 = 15件, キャンセル: 3件（除外）
    const customerAConsulting = customerAGroup?.services.find(
      (s) => s.serviceId === 'SVC-001'
    );
    expect(customerAConsulting?.serviceName).toBe('コンサルティング');
    expect(customerAConsulting?.quantity).toBe(15);
    expect(customerAConsulting?.unitPrice).toBe(50000);
    expect(customerAConsulting?.subtotal).toBe(750000); // 15 * 50000
    expect(customerAConsulting?.tax).toBe(75000); // 750000 * 0.10
    expect(customerAConsulting?.total).toBe(825000); // 750000 + 75000

    // 顧客A - システム開発（SVC-002）の集計確認
    const customerADevelopment = customerAGroup?.services.find(
      (s) => s.serviceId === 'SVC-002'
    );
    expect(customerADevelopment?.serviceName).toBe('システム開発');
    expect(customerADevelopment?.quantity).toBe(2);
    expect(customerADevelopment?.unitPrice).toBe(300000);
    expect(customerADevelopment?.subtotal).toBe(600000); // 2 * 300000
    expect(customerADevelopment?.tax).toBe(60000); // 600000 * 0.10
    expect(customerADevelopment?.total).toBe(660000); // 600000 + 60000

    // 顧客Aの合計検証
    expect(customerAGroup?.customerTotal).toBe(1350000); // 825000 + 660000 - 135000
    expect(customerAGroup?.customerTax).toBe(135000); // 75000 + 60000
    expect(customerAGroup?.customerGrandTotal).toBe(1485000); // 1350000 + 135000

    // 顧客Bのグループ検証
    const customerBGroup = result.customerGroups.find((g) => g.customerId === 'CUST-B');
    expect(customerBGroup).toBeDefined();
    expect(customerBGroup?.customerName).toBe('顧客B');
    expect(customerBGroup?.services.length).toBe(2);

    // 顧客B - コンサルティング（SVC-001）の集計確認
    const customerBConsulting = customerBGroup?.services.find(
      (s) => s.serviceId === 'SVC-001'
    );
    expect(customerBConsulting?.quantity).toBe(8);
    expect(customerBConsulting?.subtotal).toBe(400000); // 8 * 50000
    expect(customerBConsulting?.tax).toBe(40000); // 400000 * 0.10
    expect(customerBConsulting?.total).toBe(440000); // 400000 + 40000

    // 顧客B - システム開発（SVC-002）の集計確認
    const customerBDevelopment = customerBGroup?.services.find(
      (s) => s.serviceId === 'SVC-002'
    );
    expect(customerBDevelopment?.quantity).toBe(1);
    expect(customerBDevelopment?.subtotal).toBe(300000); // 1 * 300000
    expect(customerBDevelopment?.tax).toBe(30000); // 300000 * 0.10
    expect(customerBDevelopment?.total).toBe(330000); // 300000 + 30000

    // 顧客Bの合計検証
    expect(customerBGroup?.customerTotal).toBe(700000); // 400000 + 300000
    expect(customerBGroup?.customerTax).toBe(70000); // 40000 + 30000
    expect(customerBGroup?.customerGrandTotal).toBe(770000); // 700000 + 70000

    // 顧客Cのグループ検証
    const customerCGroup = result.customerGroups.find((g) => g.customerId === 'CUST-C');
    expect(customerCGroup).toBeDefined();
    expect(customerCGroup?.customerName).toBe('顧客C');
    expect(customerCGroup?.services.length).toBe(1);

    // 顧客C - コンサルティング（SVC-001）の集計確認
    const customerCConsulting = customerCGroup?.services.find(
      (s) => s.serviceId === 'SVC-001'
    );
    expect(customerCConsulting?.quantity).toBe(6);
    expect(customerCConsulting?.subtotal).toBe(300000); // 6 * 50000
    expect(customerCConsulting?.tax).toBe(30000); // 300000 * 0.10
    expect(customerCConsulting?.total).toBe(330000); // 300000 + 30000

    // 顧客Cの合計検証
    expect(customerCGroup?.customerTotal).toBe(300000);
    expect(customerCGroup?.customerTax).toBe(30000);
    expect(customerCGroup?.customerGrandTotal).toBe(330000);

    // 全体集計の検証
    expect(result.grandTotal).toBe(2350000); // 1350000 + 700000 + 300000
    expect(result.totalTax).toBe(235000); // 135000 + 70000 + 30000
    expect(result.totalWithTax).toBe(2585000); // 2350000 + 235000

    // 請求対象外データ（キャンセル）が除外されていることを確認
    expect(result.excludedCount).toBe(1); // SALE-006 (cancelled)

    // 請求対象データの合計件数確認
    expect(result.includedCount).toBe(6); // SALE-001, 002, 003, 004, 005, 007
  });
});
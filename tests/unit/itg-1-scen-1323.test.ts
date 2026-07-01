import { extractBillingItems, aggregateBillingAmountByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1323: 請求対象項目の自動抽出と顧客別・サービス別請求額集計', () => {
    // テストデータ: 複数の営業案件データ（顧客情報、サービス内容、金額、請求対象フラグ）
    const salesData = [
      {
        id: 'sales_001',
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        amount: 100000,
        isBillable: true,
        date: '2024-01-15',
      },
      {
        id: 'sales_002',
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        amount: 50000,
        isBillable: true,
        date: '2024-01-20',
      },
      {
        id: 'sales_003',
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        amount: 200000,
        isBillable: true,
        date: '2024-01-25',
      },
      {
        id: 'sales_004',
        customerId: 'cust_B',
        customerName: 'B社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        amount: 75000,
        isBillable: true,
        date: '2024-01-18',
      },
      {
        id: 'sales_005',
        customerId: 'cust_B',
        customerName: 'B社',
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        amount: 150000,
        isBillable: false,
        date: '2024-01-22',
      },
      {
        id: 'sales_006',
        customerId: 'cust_C',
        customerName: 'C社',
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        amount: 120000,
        isBillable: true,
        date: '2024-01-28',
      },
    ];

    // ステップ1: 請求対象項目の自動抽出機能を実行
    const extractedItems = extractBillingItems(salesData);

    // ステップ2: 抽出されたデータが請求対象として正しくフィルタリングされたことを確認
    expect(extractedItems).toEqual([
      {
        id: 'sales_001',
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        amount: 100000,
        isBillable: true,
        date: '2024-01-15',
      },
      {
        id: 'sales_002',
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        amount: 50000,
        isBillable: true,
        date: '2024-01-20',
      },
      {
        id: 'sales_003',
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        amount: 200000,
        isBillable: true,
        date: '2024-01-25',
      },
      {
        id: 'sales_004',
        customerId: 'cust_B',
        customerName: 'B社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        amount: 75000,
        isBillable: true,
        date: '2024-01-18',
      },
      {
        id: 'sales_006',
        customerId: 'cust_C',
        customerName: 'C社',
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        amount: 120000,
        isBillable: true,
        date: '2024-01-28',
      },
    ]);

    // ステップ3: 顧客別・サービス別の請求額集計を実行
    const aggregatedResult = aggregateBillingAmountByCustomerAndService(extractedItems);

    // ステップ4: 集計結果が顧客別・サービス別に正しく分類されていることを確認
    expect(aggregatedResult.byCustomerAndService).toEqual([
      {
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        totalAmount: 150000,
        itemCount: 2,
      },
      {
        customerId: 'cust_A',
        customerName: 'A社',
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        totalAmount: 200000,
        itemCount: 1,
      },
      {
        customerId: 'cust_B',
        customerName: 'B社',
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        totalAmount: 75000,
        itemCount: 1,
      },
      {
        customerId: 'cust_C',
        customerName: 'C社',
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        totalAmount: 120000,
        itemCount: 1,
      },
    ]);

    // ステップ5: 顧客別の集計結果を確認
    expect(aggregatedResult.byCustomer).toEqual([
      {
        customerId: 'cust_A',
        customerName: 'A社',
        totalAmount: 350000,
        serviceCount: 2,
        itemCount: 3,
      },
      {
        customerId: 'cust_B',
        customerName: 'B社',
        totalAmount: 75000,
        serviceCount: 1,
        itemCount: 1,
      },
      {
        customerId: 'cust_C',
        customerName: 'C社',
        totalAmount: 120000,
        serviceCount: 1,
        itemCount: 1,
      },
    ]);

    // ステップ6: 合計金額が正しいことを確認（抽出対象5件の合計 = 100000 + 50000 + 200000 + 75000 + 120000 = 545000）
    expect(aggregatedResult.grandTotal).toBe(545000);

    // ステップ7: 集計結果に重複や漏れがないことを確認（請求対象外の sales_005（150000）が除外されていること）
    expect(aggregatedResult.excludedItemCount).toBe(1);

    // ステップ8: サービス別の集計結果を確認
    expect(aggregatedResult.byService).toEqual([
      {
        serviceId: 'svc_1',
        serviceName: 'コンサルティング',
        totalAmount: 225000,
        customerCount: 2,
        itemCount: 3,
      },
      {
        serviceId: 'svc_2',
        serviceName: 'システム構築',
        totalAmount: 320000,
        customerCount: 2,
        itemCount: 2,
      },
    ]);
  });
});
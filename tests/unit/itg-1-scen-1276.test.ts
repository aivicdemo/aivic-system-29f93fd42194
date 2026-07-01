import { extractAndAggregateBillingItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目の自動抽出・顧客別サービス別請求額集計', () => {
  // SCEN-1276
  test('契約書の抽出ルールに基づいて営業データから請求対象項目を自動判定し、顧客ごと・サービスごとの請求額を正確に集計する', () => {
    // テストデータセットアップ
    const contracts = [
      {
        contractId: 'C001',
        customerId: 'CUST001',
        serviceType: 'service_a',
        extractionRule: 'amount_gt_10000',
        unitPrice: 1000,
        quantity: 1,
      },
      {
        contractId: 'C002',
        customerId: 'CUST001',
        serviceType: 'service_b',
        extractionRule: 'status_eq_completed',
        unitPrice: 500,
        quantity: 1,
      },
      {
        contractId: 'C003',
        customerId: 'CUST002',
        serviceType: 'service_a',
        extractionRule: 'amount_gt_5000',
        unitPrice: 800,
        quantity: 1,
      },
      {
        contractId: 'C004',
        customerId: 'CUST002',
        serviceType: 'service_b',
        extractionRule: 'status_eq_completed',
        unitPrice: 1200,
        quantity: 1,
      },
    ];

    const salesData = [
      {
        salesDataId: 'SD001',
        customerId: 'CUST001',
        serviceType: 'service_a',
        amount: 15000,
        status: 'completed',
        billingTarget: true,
      },
      {
        salesDataId: 'SD002',
        customerId: 'CUST001',
        serviceType: 'service_a',
        amount: 8000,
        status: 'completed',
        billingTarget: false,
      },
      {
        salesDataId: 'SD003',
        customerId: 'CUST001',
        serviceType: 'service_b',
        amount: 5000,
        status: 'completed',
        billingTarget: true,
      },
      {
        salesDataId: 'SD004',
        customerId: 'CUST001',
        serviceType: 'service_b',
        amount: 3000,
        status: 'pending',
        billingTarget: false,
      },
      {
        salesDataId: 'SD005',
        customerId: 'CUST002',
        serviceType: 'service_a',
        amount: 7500,
        status: 'completed',
        billingTarget: true,
      },
      {
        salesDataId: 'SD006',
        customerId: 'CUST002',
        serviceType: 'service_a',
        amount: 3000,
        status: 'completed',
        billingTarget: false,
      },
      {
        salesDataId: 'SD007',
        customerId: 'CUST002',
        serviceType: 'service_b',
        amount: 6000,
        status: 'completed',
        billingTarget: true,
      },
      {
        salesDataId: 'SD008',
        customerId: 'CUST002',
        serviceType: 'service_b',
        amount: 4000,
        status: 'draft',
        billingTarget: false,
      },
    ];

    // 実行: 自動抽出・集計機能を実行
    const result = extractAndAggregateBillingItems(contracts, salesData);

    // 検証: 抽出ルールエンジンが契約書定義に基づいて請求対象項目を判定
    expect(result).toBeDefined();
    expect(result).toHaveProperty('extractedItems');
    expect(result).toHaveProperty('customerAggregation');
    expect(result).toHaveProperty('serviceAggregation');
    expect(result).toHaveProperty('crossTabulation');

    // 検証: 請求対象と判定されたデータのみが集計対象に含まれる
    const extractedItems = result.extractedItems;
    expect(extractedItems.length).toBe(4);
    expect(
      extractedItems.every((item: any) => item.billingTarget === true)
    ).toBe(true);

    // 検証: 顧客ごとの請求額合計が正確に計算されている
    // CUST001: SD001 (15000) + SD003 (5000) = 20000
    // CUST002: SD005 (7500) + SD007 (6000) = 13500
    const customerAggregation = result.customerAggregation;
    expect(customerAggregation['CUST001']).toBe(20000);
    expect(customerAggregation['CUST002']).toBe(13500);

    // 検証: サービス種別ごとの請求額合計が正確に計算されている
    // service_a: SD001 (15000) + SD005 (7500) = 22500
    // service_b: SD003 (5000) + SD007 (6000) = 11000
    const serviceAggregation = result.serviceAggregation;
    expect(serviceAggregation['service_a']).toBe(22500);
    expect(serviceAggregation['service_b']).toBe(11000);

    // 検証: 顧客・サービス別クロス集計結果が期待値と一致
    const crossTab = result.crossTabulation;
    expect(crossTab['CUST001']['service_a']).toBe(15000);
    expect(crossTab['CUST001']['service_b']).toBe(5000);
    expect(crossTab['CUST002']['service_a']).toBe(7500);
    expect(crossTab['CUST002']['service_b']).toBe(6000);

    // 検証: 請求対象外の項目が集計から除外されている
    expect(extractedItems.find((i: any) => i.salesDataId === 'SD002')).toBeUndefined();
    expect(extractedItems.find((i: any) => i.salesDataId === 'SD004')).toBeUndefined();
    expect(extractedItems.find((i: any) => i.salesDataId === 'SD006')).toBeUndefined();
    expect(extractedItems.find((i: any) => i.salesDataId === 'SD008')).toBeUndefined();

    // 検証: 複数顧客・複数サービスの組み合わせで集計結果の整合性を検証
    const totalBillingAmount =
      customerAggregation['CUST001'] + customerAggregation['CUST002'];
    expect(totalBillingAmount).toBe(33500);

    const totalByService =
      serviceAggregation['service_a'] + serviceAggregation['service_b'];
    expect(totalByService).toBe(33500);

    // 整合性: クロス集計の合計がカスタマー合計と一致
    const crossTabTotal = Object.values(crossTab).reduce(
      (custSum: number, services: any) => {
        return (
          custSum +
          Object.values(services).reduce((svcSum: number, amount: any) => {
            return svcSum + (typeof amount === 'number' ? amount : 0);
          }, 0)
        );
      },
      0
    );
    expect(crossTabTotal).toBe(33500);
  });
});
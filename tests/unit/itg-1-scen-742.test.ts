import { extractBillableItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-742
  test('請求対象項目の自動抽出・集計 - 営業データから請求ルールに基づいて請求対象項目が正確に抽出される', () => {
    // テスト用営業データ
    const salesData = [
      {
        id: 'sales_001',
        customerId: 'cust_A',
        productCode: 'prod_service_001',
        transactionAmount: 100000,
        transactionDate: '2024-01-15',
        billingCategory: 'billable',
        status: 'completed',
        serviceType: 'service_x'
      },
      {
        id: 'sales_002',
        customerId: 'cust_A',
        productCode: 'prod_service_001',
        transactionAmount: 50000,
        transactionDate: '2024-01-20',
        billingCategory: 'billable',
        status: 'completed',
        serviceType: 'service_x'
      },
      {
        id: 'sales_003',
        customerId: 'cust_B',
        productCode: 'prod_service_002',
        transactionAmount: 75000,
        transactionDate: '2024-01-25',
        billingCategory: 'billable',
        status: 'completed',
        serviceType: 'service_y'
      },
      {
        id: 'sales_004',
        customerId: 'cust_A',
        productCode: 'prod_service_001',
        transactionAmount: 30000,
        transactionDate: '2024-01-10',
        billingCategory: 'non_billable',
        status: 'cancelled',
        serviceType: 'service_x'
      },
      {
        id: 'sales_005',
        customerId: 'cust_B',
        productCode: 'prod_service_002',
        transactionAmount: 25000,
        transactionDate: '2024-01-28',
        billingCategory: 'billable',
        status: 'already_billed',
        serviceType: 'service_y'
      }
    ];

    // 請求ルール設定
    const billingRules = {
      targetCustomerCategories: ['cust_A', 'cust_B'],
      targetProductCategories: ['prod_service_001', 'prod_service_002'],
      billingPeriodStart: '2024-01-01',
      billingPeriodEnd: '2024-01-31',
      excludeStatuses: ['cancelled', 'already_billed'],
      requireBillingCategory: 'billable'
    };

    // 自動抽出機能を実行
    const result = extractBillableItems({
      salesData,
      billingRules,
      executionDate: '2024-02-01'
    });

    // ===== 検証開始 =====

    // ① すべての対象項目が正しく抽出されていることを確認
    expect(result.extractedItems).toHaveLength(3);
    expect(result.extractedItems.map((item: any) => item.id)).toEqual([
      'sales_001',
      'sales_002',
      'sales_003'
    ]);

    // ② 除外条件に該当する項目が除外されていることを確認
    // sales_004: status='cancelled' なので除外されるべき
    // sales_005: status='already_billed' なので除外されるべき
    const extractedIds = result.extractedItems.map((item: any) => item.id);
    expect(extractedIds).not.toContain('sales_004');
    expect(extractedIds).not.toContain('sales_005');

    // ③ 抽出項目の集計金額・件数が正確であることを確認
    // 顧客A、サービスX: 100000 + 50000 = 150000（2件）
    const custA_serviceX = result.aggregatedByCustomerAndService.find(
      (agg: any) => agg.customerId === 'cust_A' && agg.serviceType === 'service_x'
    );
    expect(custA_serviceX).toBeDefined();
    expect(custA_serviceX.totalAmount).toBe(150000);
    expect(custA_serviceX.itemCount).toBe(2);

    // 顧客B、サービスY: 75000（1件）
    const custB_serviceY = result.aggregatedByCustomerAndService.find(
      (agg: any) => agg.customerId === 'cust_B' && agg.serviceType === 'service_y'
    );
    expect(custB_serviceY).toBeDefined();
    expect(custB_serviceY.totalAmount).toBe(75000);
    expect(custB_serviceY.itemCount).toBe(1);

    // 全体集計金額: 150000 + 75000 = 225000
    expect(result.totalBillableAmount).toBe(225000);
    expect(result.totalItemCount).toBe(3);

    // ④ 抽出ログに不正なエラーや警告が記録されていないことを確認
    expect(result.executionLog).toBeDefined();
    expect(result.executionLog.errors).toHaveLength(0);
    expect(result.executionLog.warnings).toHaveLength(0);
    expect(result.executionLog.status).toBe('success');

    // 抽出ログに正常な処理記録が含まれていることを確認
    expect(result.executionLog.extractionStartTime).toBeDefined();
    expect(result.executionLog.extractionEndTime).toBeDefined();
    expect(result.executionLog.processedRecordCount).toBe(5);
    expect(result.executionLog.excludedRecordCount).toBe(2);

    // 実行日時が記録されていることを確認
    expect(result.executedAt).toBe('2024-02-01');
  });
});
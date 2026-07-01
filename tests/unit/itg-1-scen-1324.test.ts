import { extractBillableItems, aggregateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1324: [normal] 請求対象項目の自動抽出と顧客別・サービス別請求額集計 - 請求対象外と判定された営業データ項目が集計対象から除外される
  test('請求対象外フラグが設定された営業データ項目が自動抽出と集計から完全に除外される', () => {
    // テストデータ準備: 請求対象外フラグが設定された営業データ項目を複数件準備
    const salesData = [
      {
        id: 'sales_001',
        customerId: 'cust_A',
        serviceId: 'svc_001',
        itemName: 'appointment_count',
        itemValue: 100,
        amount: 50000,
        isBillable: true,
        recordedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'sales_002',
        customerId: 'cust_A',
        serviceId: 'svc_001',
        itemName: 'discount_item',
        itemValue: 50,
        amount: 5000,
        isBillable: false,
        recordedAt: '2024-01-15T11:00:00Z',
      },
      {
        id: 'sales_003',
        customerId: 'cust_A',
        serviceId: 'svc_001',
        itemName: 'contract_count',
        itemValue: 30,
        amount: 45000,
        isBillable: true,
        recordedAt: '2024-01-15T12:00:00Z',
      },
      {
        id: 'sales_004',
        customerId: 'cust_A',
        serviceId: 'svc_002',
        itemName: 'internal_adjustment',
        itemValue: 20,
        amount: 10000,
        isBillable: false,
        recordedAt: '2024-01-15T13:00:00Z',
      },
      {
        id: 'sales_005',
        customerId: 'cust_A',
        serviceId: 'svc_002',
        itemName: 'revenue_from_sales',
        itemValue: 200,
        amount: 80000,
        isBillable: true,
        recordedAt: '2024-01-15T14:00:00Z',
      },
      {
        id: 'sales_006',
        customerId: 'cust_B',
        serviceId: 'svc_001',
        itemName: 'promo_credit',
        itemValue: 15,
        amount: 3000,
        isBillable: false,
        recordedAt: '2024-01-15T15:00:00Z',
      },
      {
        id: 'sales_007',
        customerId: 'cust_B',
        serviceId: 'svc_001',
        itemName: 'consultation_count',
        itemValue: 80,
        amount: 40000,
        isBillable: true,
        recordedAt: '2024-01-15T16:00:00Z',
      },
    ];

    // 請求対象外フラグが『true』に設定されたデータ項目を確認
    const nonBillableItems = salesData.filter((item) => item.isBillable === false);
    expect(nonBillableItems).toHaveLength(3);
    expect(nonBillableItems.map((item) => item.itemName)).toEqual([
      'discount_item',
      'internal_adjustment',
      'promo_credit',
    ]);

    // 請求対象外と判定された項目を含む営業データセットをシステムに入力
    // 請求対象項目の自動抽出処理を実行
    const extractedBillableItems = extractBillableItems(salesData);

    // 抽出結果から請求対象外フラグ『true』の項目が除外されていることを確認
    expect(extractedBillableItems).toHaveLength(4);
    const extractedIds = extractedBillableItems.map((item) => item.id);
    expect(extractedIds).toEqual(['sales_001', 'sales_003', 'sales_005', 'sales_007']);
    expect(extractedIds).not.toContain('sales_002');
    expect(extractedIds).not.toContain('sales_004');
    expect(extractedIds).not.toContain('sales_006');

    // すべての抽出アイテムが請求対象であることを確認
    extractedBillableItems.forEach((item) => {
      expect(item.isBillable).toBe(true);
    });

    // 顧客別・サービス別の請求額集計処理を実行
    const billingAggregation = aggregateBillingAmount(extractedBillableItems);

    // 集計対象データに請求対象外項目が含まれていないことを確認
    // cust_A + svc_001: 50000 + 45000 = 95000
    // cust_A + svc_002: 80000
    // cust_B + svc_001: 40000
    const custA_svc001 = billingAggregation.find(
      (agg) => agg.customerId === 'cust_A' && agg.serviceId === 'svc_001'
    );
    expect(custA_svc001).toBeDefined();
    expect(custA_svc001!.totalAmount).toBe(95000);
    expect(custA_svc001!.itemCount).toBe(2);

    const custA_svc002 = billingAggregation.find(
      (agg) => agg.customerId === 'cust_A' && agg.serviceId === 'svc_002'
    );
    expect(custA_svc002).toBeDefined();
    expect(custA_svc002!.totalAmount).toBe(80000);
    expect(custA_svc002!.itemCount).toBe(1);

    const custB_svc001 = billingAggregation.find(
      (agg) => agg.customerId === 'cust_B' && agg.serviceId === 'svc_001'
    );
    expect(custB_svc001).toBeDefined();
    expect(custB_svc001!.totalAmount).toBe(40000);
    expect(custB_svc001!.itemCount).toBe(1);

    // 請求対象外項目の金額が集計結果に反映されていないことを検証
    // discount_item (5000), internal_adjustment (10000), promo_credit (3000) は含まれない
    const totalBilledAmount = billingAggregation.reduce((sum, agg) => sum + agg.totalAmount, 0);
    expect(totalBilledAmount).toBe(215000); // 95000 + 80000 + 40000
    const nonBillableAmount = nonBillableItems.reduce((sum, item) => sum + item.amount, 0);
    expect(nonBillableAmount).toBe(18000); // 5000 + 10000 + 3000
    expect(totalBilledAmount + nonBillableAmount).toBe(233000); // 元データの合計

    // 請求対象項目のみで正しく集計されていることを確認
    expect(billingAggregation).toHaveLength(3);
    billingAggregation.forEach((agg) => {
      expect(agg.totalAmount).toBeGreaterThan(0);
      expect(agg.itemCount).toBeGreaterThan(0);
    });
  });
});
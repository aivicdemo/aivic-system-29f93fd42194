import { describe, test, expect } from '@jest/globals';
import { calculateBillingAmountByCustomerAndService } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 請求対象項目自動抽出・集計', () => {
  test('SCEN-1058: 営業活動データから請求ルールに基づいて顧客別・サービス別の請求額が正確に集計される', () => {
    // テスト用の営業活動データ
    const salesActivities = [
      {
        id: 'activity_001',
        customerId: 'cust_A',
        serviceType: 'service_basic',
        amount: 100000,
        appointmentCount: 5,
        contractCount: 2,
        date: '2024-01-15'
      },
      {
        id: 'activity_002',
        customerId: 'cust_A',
        serviceType: 'service_premium',
        amount: 150000,
        appointmentCount: 8,
        contractCount: 3,
        date: '2024-01-16'
      },
      {
        id: 'activity_003',
        customerId: 'cust_B',
        serviceType: 'service_basic',
        amount: 80000,
        appointmentCount: 4,
        contractCount: 1,
        date: '2024-01-17'
      },
      {
        id: 'activity_004',
        customerId: 'cust_B',
        serviceType: 'service_premium',
        amount: 200000,
        appointmentCount: 10,
        contractCount: 4,
        date: '2024-01-18'
      }
    ];

    // 請求ルール設定
    // 顧客別割引率: cust_A=10%, cust_B=5%
    // サービス別料金: service_basic=1000円/アポ, service_premium=1500円/アポ
    // 成約数による追加料金: 1成約あたり5000円
    const billingRules = {
      customerDiscounts: {
        cust_A: 0.10,
        cust_B: 0.05
      },
      servicePricingPerAppointment: {
        service_basic: 1000,
        service_premium: 1500
      },
      contractBonusPerContract: 5000,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 500000
    };

    // 期待される計算ロジック:
    // cust_A × service_basic:
    //   = (5 appts × 1000) + (2 contracts × 5000) = 5000 + 10000 = 15000
    //   割引前小計: 15000
    //   割引率10%適用: 15000 × (1 - 0.10) = 13500
    //   最小請求額50000 >= 13500なので -> 50000
    //
    // cust_A × service_premium:
    //   = (8 appts × 1500) + (3 contracts × 5000) = 12000 + 15000 = 27000
    //   割引前小計: 27000
    //   割引率10%適用: 27000 × (1 - 0.10) = 24300
    //   最小請求額50000 >= 24300なので -> 50000
    //
    // cust_A合計: 50000 + 50000 = 100000
    //
    // cust_B × service_basic:
    //   = (4 appts × 1000) + (1 contract × 5000) = 4000 + 5000 = 9000
    //   割引前小計: 9000
    //   割引率5%適用: 9000 × (1 - 0.05) = 8550
    //   最小請求額50000 >= 8550なので -> 50000
    //
    // cust_B × service_premium:
    //   = (10 appts × 1500) + (4 contracts × 5000) = 15000 + 20000 = 35000
    //   割引前小計: 35000
    //   割引率5%適用: 35000 × (1 - 0.05) = 33250
    //   最小請求額50000 >= 33250なので -> 50000
    //
    // cust_B合計: 50000 + 50000 = 100000
    //
    // 全体合計: 100000 + 100000 = 200000

    const result = calculateBillingAmountByCustomerAndService(
      salesActivities,
      billingRules
    );

    // 顧客別請求額の検証
    expect(result.byCustomer).toEqual({
      cust_A: 100000,
      cust_B: 100000
    });

    // サービス別請求額の検証
    expect(result.byService).toEqual({
      service_basic: 100000,
      service_premium: 100000
    });

    // 顧客別・サービス別組み合わせの検証
    expect(result.byCustomerAndService).toEqual({
      'cust_A|service_basic': 50000,
      'cust_A|service_premium': 50000,
      'cust_B|service_basic': 50000,
      'cust_B|service_premium': 50000
    });

    // 全体合計の検証
    expect(result.totalBillingAmount).toBe(200000);

    // 抽出された請求対象項目の検証
    expect(result.extractedItems).toHaveLength(4);
    expect(result.extractedItems[0]).toEqual({
      customerId: 'cust_A',
      serviceType: 'service_basic',
      appointmentCount: 5,
      contractCount: 2,
      baseAmount: 15000,
      discountRate: 0.10,
      discountedAmount: 13500,
      finalBillingAmount: 50000
    });

    expect(result.extractedItems[1]).toEqual({
      customerId: 'cust_A',
      serviceType: 'service_premium',
      appointmentCount: 8,
      contractCount: 3,
      baseAmount: 27000,
      discountRate: 0.10,
      discountedAmount: 24300,
      finalBillingAmount: 50000
    });

    expect(result.extractedItems[2]).toEqual({
      customerId: 'cust_B',
      serviceType: 'service_basic',
      appointmentCount: 4,
      contractCount: 1,
      baseAmount: 9000,
      discountRate: 0.05,
      discountedAmount: 8550,
      finalBillingAmount: 50000
    });

    expect(result.extractedItems[3]).toEqual({
      customerId: 'cust_B',
      serviceType: 'service_premium',
      appointmentCount: 10,
      contractCount: 4,
      baseAmount: 35000,
      discountRate: 0.05,
      discountedAmount: 33250,
      finalBillingAmount: 50000
    });

    // 請求ルール適用の検証
    expect(result.appliedRules).toEqual({
      customerDiscountApplied: true,
      servicePricingApplied: true,
      contractBonusApplied: true,
      minimumBillingEnforced: true,
      maximumBillingEnforced: false
    });

    // ステータスの検証
    expect(result.status).toBe('success');
    expect(result.processedRecordCount).toBe(4);
    expect(result.errorCount).toBe(0);
  });
});
import { describe, test, expect } from '@jest/globals';
import { applyBillingRulesWithPriority } from '../../src/logic/it-1-2-1';

describe('it-1-2-1: 請求ルール適用ロジック - 複数割引基準の優先順序適用', () => {
  // SCEN-882
  test('複数の割引基準が優先順序に従って階層的に適用されること', () => {
    // 複数の割引基準を定義（優先度付き）
    const discountCriteria = [
      {
        id: 'discount_001',
        name: '顧客ランク割引',
        priority: 1,
        discountRate: 0.10, // 10%
        condition: { customerRank: 'gold' }
      },
      {
        id: 'discount_002',
        name: '購買金額割引',
        priority: 2,
        discountRate: 0.05, // 5%
        condition: { minPurchaseAmount: 100000 }
      },
      {
        id: 'discount_003',
        name: 'キャンペーン割引',
        priority: 3,
        discountRate: 0.15, // 15%
        condition: { campaignActive: true }
      }
    ];

    // テスト用請求データ
    const billingData = {
      customerId: 'cust_123',
      customerRank: 'gold',
      baseAmount: 200000,
      purchaseAmount: 150000,
      campaignActive: true,
      serviceType: 'premium'
    };

    // 請求ルール適用ロジックを実行
    const result = applyBillingRulesWithPriority({
      discountCriteria,
      billingData
    });

    // 優先度1：顧客ランク割引 10% → 200,000 × 0.10 = 20,000
    const discountAt1 = 200000 * 0.10;
    const amountAfter1 = 200000 - discountAt1; // 180,000

    // 優先度2：購買金額割引 5% → 180,000 × 0.05 = 9,000
    const discountAt2 = amountAfter1 * 0.05;
    const amountAfter2 = amountAfter1 - discountAt2; // 171,000

    // 優先度3：キャンペーン割引 15% → 171,000 × 0.15 = 25,650
    const discountAt3 = amountAfter2 * 0.15;
    const finalAmount = amountAfter2 - discountAt3; // 145,350

    // 最終請求額が正確に計算されていることを検証
    expect(result.finalAmount).toBe(145350);

    // 適用された割引の優先順序を検証
    expect(result.appliedDiscounts).toEqual([
      {
        discountId: 'discount_001',
        priority: 1,
        discountRate: 0.10,
        appliedAmount: 20000
      },
      {
        discountId: 'discount_002',
        priority: 2,
        discountRate: 0.05,
        appliedAmount: 9000
      },
      {
        discountId: 'discount_003',
        priority: 3,
        discountRate: 0.15,
        appliedAmount: 25650
      }
    ]);

    // 総割引額が正確であることを検証
    const totalDiscount = 20000 + 9000 + 25650;
    expect(result.totalDiscountAmount).toBe(54650);

    // 適用順序が優先度に従っていることを検証
    expect(result.appliedDiscounts[0].priority).toBe(1);
    expect(result.appliedDiscounts[1].priority).toBe(2);
    expect(result.appliedDiscounts[2].priority).toBe(3);

    // 重複適用がないことを検証
    expect(result.appliedDiscounts.length).toBe(3);

    // 各割引が適用されていることを検証
    expect(result.appliedDiscounts.every(d => d.appliedAmount > 0)).toBe(true);

    // 計算の一貫性を検証：基本額 - 総割引額 = 最終額
    expect(result.baseAmount - result.totalDiscountAmount).toBe(result.finalAmount);
    expect(200000 - 54650).toBe(145350);
  });

  test('優先度の異なる組み合わせで割引が正しく適用されること', () => {
    const discountCriteria = [
      {
        id: 'discount_004',
        name: 'VIP割引',
        priority: 1,
        discountRate: 0.20, // 20%
        condition: { customerType: 'vip' }
      },
      {
        id: 'discount_005',
        name: '季節割引',
        priority: 2,
        discountRate: 0.08, // 8%
        condition: { seasonalPromotion: true }
      }
    ];

    const billingData = {
      customerId: 'cust_456',
      customerType: 'vip',
      baseAmount: 500000,
      seasonalPromotion: true,
      serviceType: 'enterprise'
    };

    const result = applyBillingRulesWithPriority({
      discountCriteria,
      billingData
    });

    // 優先度1：VIP割引 20% → 500,000 × 0.20 = 100,000
    const discountAt1 = 500000 * 0.20;
    const amountAfter1 = 500000 - discountAt1; // 400,000

    // 優先度2：季節割引 8% → 400,000 × 0.08 = 32,000
    const discountAt2 = amountAfter1 * 0.08;
    const finalAmount = amountAfter1 - discountAt2; // 368,000

    expect(result.finalAmount).toBe(368000);
    expect(result.totalDiscountAmount).toBe(132000);
    expect(result.appliedDiscounts.length).toBe(2);
    expect(result.appliedDiscounts[0].priority).toBe(1);
    expect(result.appliedDiscounts[1].priority).toBe(2);
  });

  test('条件を満たさない割引は適用されないこと', () => {
    const discountCriteria = [
      {
        id: 'discount_006',
        name: '大口割引',
        priority: 1,
        discountRate: 0.12, // 12%
        condition: { minPurchaseAmount: 300000 }
      },
      {
        id: 'discount_007',
        name: 'ロイヤリティ割引',
        priority: 2,
        discountRate: 0.07, // 7%
        condition: { loyaltyYears: 5 }
      }
    ];

    const billingData = {
      customerId: 'cust_789',
      baseAmount: 150000, // 大口割引の条件を満たさない
      purchaseAmount: 150000,
      loyaltyYears: 2, // ロイヤリティ割引の条件を満たさない
      serviceType: 'standard'
    };

    const result = applyBillingRulesWithPriority({
      discountCriteria,
      billingData
    });

    // どの割引も適用されないため、最終額は基本額と同じ
    expect(result.finalAmount).toBe(150000);
    expect(result.totalDiscountAmount).toBe(0);
    expect(result.appliedDiscounts.length).toBe(0);
  });

  test('単一の割引基準のみ適用される場合を検証すること', () => {
    const discountCriteria = [
      {
        id: 'discount_008',
        name: '新規顧客割引',
        priority: 1,
        discountRate: 0.15, // 15%
        condition: { isNewCustomer: true }
      },
      {
        id: 'discount_009',
        name: 'リピーター割引',
        priority: 2,
        discountRate: 0.10, // 10%
        condition: { repeatPurchaseCount: 5 }
      }
    ];

    const billingData = {
      customerId: 'cust_new',
      baseAmount: 100000,
      isNewCustomer: true,
      repeatPurchaseCount: 0, // このためリピーター割引は適用されない
      serviceType: 'basic'
    };

    const result = applyBillingRulesWithPriority({
      discountCriteria,
      billingData
    });

    // 新規顧客割引のみが適用される
    const expectedDiscount = 100000 * 0.15;
    const expectedFinalAmount = 100000 - expectedDiscount;

    expect(result.finalAmount).toBe(85000);
    expect(result.totalDiscountAmount).toBe(15000);
    expect(result.appliedDiscounts.length).toBe(1);
    expect(result.appliedDiscounts[0].discountId).toBe('discount_008');
    expect(result.appliedDiscounts[0].priority).toBe(1);
  });

  test('すべての割引が適用された場合の一貫性を検証すること', () => {
    const discountCriteria = [
      {
        id: 'discount_010',
        name: '割引A',
        priority: 1,
        discountRate: 0.05, // 5%
        condition: { typeA: true }
      },
      {
        id: 'discount_011',
        name: '割引B',
        priority: 2,
        discountRate: 0.06, // 6%
        condition: { typeB: true }
      },
      {
        id: 'discount_012',
        name: '割引C',
        priority: 3,
        discountRate: 0.04, // 4%
        condition: { typeC: true }
      }
    ];

    const billingData = {
      customerId: 'cust_multi',
      baseAmount: 1000000,
      typeA: true,
      typeB: true,
      typeC: true,
      serviceType: 'all'
    };

    const result = applyBillingRulesWithPriority({
      discountCriteria,
      billingData
    });

    // 優先度1：5% → 1,000,000 × 0.05 = 50,000 → 950,000
    // 優先度2：6% → 950,000 × 0.06 = 57,000 → 893,000
    // 優先度3：4% → 893,000 × 0.04 = 35,720 → 857,280

    expect(result.finalAmount).toBe(857280);
    expect(result.totalDiscountAmount).toBe(142720);
    expect(result.appliedDiscounts.length).toBe(3);

    // 優先順序が保たれていることを確認
    for (let i = 0; i < result.appliedDiscounts.length - 1; i++) {
      expect(result.appliedDiscounts[i].priority).toBeLessThan(
        result.appliedDiscounts[i + 1].priority
      );
    }

    // 基本額と最終額から総割引額を逆算して一貫性を検証
    expect(result.baseAmount - result.finalAmount).toBe(result.totalDiscountAmount);
  });
});
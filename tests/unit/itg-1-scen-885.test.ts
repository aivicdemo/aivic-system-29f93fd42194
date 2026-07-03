import { describe, test, expect } from '@jest/globals';
import { calculateDiscountRateAndBillingAmount } from '../../src/logic/it-1-2-1';

describe('割引・キャンペーン適用判定機能', () => {
  test('SCEN-885: 契約条件と成果データが一致して割引率が正しく特定される', () => {
    // 契約条件データ（テスト用）
    const contractData = {
      contractId: 'CNT-2024-001',
      customerId: 'CUST-A001',
      contractAmount: 1000000, // 契約金額: 100万円
      contractStartDate: new Date('2024-01-01T00:00:00Z'),
      contractEndDate: new Date('2024-12-31T23:59:59Z'),
      customerSegment: 'premium', // 顧客区分: premium
      baseUnitPrice: 10000, // 基本単価
      discountRuleId: 'RULE-PREMIUM-2024',
    };

    // 成果データ（テスト用）
    const achievementData = {
      customerId: 'CUST-A001',
      serviceId: 'SVC-SALES-001',
      appointmentCount: 50, // アポ数
      closedDealsCount: 25, // 成約数
      achievementRate: 0.95, // 達成率: 95%
      campaignParticipation: true, // キャンペーン参加状況: 参加
      reportingPeriod: '2024-01',
    };

    // 割引・キャンペーン適用判定を実行
    const result = calculateDiscountRateAndBillingAmount({
      contract: contractData,
      achievement: achievementData,
    });

    // 【assertion 1】割引率が正しく特定されること
    // 期待割引率: premium 顧客 + 95% 達成率 + キャンペーン参加 = 15% 割引
    expect(result.discountRate).toBe(0.15);

    // 【assertion 2】割引適用後の請求額が正しく計算されていること
    // 基本請求額: 50 (アポ) × 10000 (基本単価) = 500,000円
    // 割引額: 500,000 × 0.15 = 75,000円
    // 割引適用後請求額: 500,000 - 75,000 = 425,000円
    expect(result.baseAmount).toBe(500000);
    expect(result.discountAmount).toBe(75000);
    expect(result.finalBillingAmount).toBe(425000);

    // 【assertion 3】契約条件と成果データが一致していることが確認されること
    expect(result.isContractDataMatched).toBe(true);

    // 【assertion 4】割引適用フラグが有効であること
    expect(result.isDiscountApplied).toBe(true);

    // 【assertion 5】割引・キャンペーン適用理由が記録されること
    expect(result.discountAppliedReason).toContain('premium');
    expect(result.discountAppliedReason).toContain('campaign');

    // 【assertion 6】請求データが正しく生成されていること
    expect(result.billingData).toEqual(
      expect.objectContaining({
        customerId: 'CUST-A001',
        serviceId: 'SVC-SALES-001',
        contractId: 'CNT-2024-001',
        baseAmount: 500000,
        discountRate: 0.15,
        discountAmount: 75000,
        finalBillingAmount: 425000,
        billingPeriod: '2024-01',
        status: 'confirmed',
      })
    );

    // 【assertion 7】結果オブジェクトが必要なすべてのフィールドを持つこと
    expect(result).toHaveProperty('discountRate');
    expect(result).toHaveProperty('baseAmount');
    expect(result).toHaveProperty('discountAmount');
    expect(result).toHaveProperty('finalBillingAmount');
    expect(result).toHaveProperty('isContractDataMatched');
    expect(result).toHaveProperty('isDiscountApplied');
    expect(result).toHaveProperty('billingData');
  });
});
import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-605: [edge] 請求額計算機能 - 営業成果数が 0 件の場合に請求額が 0 円と計算される', () => {
    // 営業成果数を0件に設定
    const salesAchievementData = [];

    // 顧客・サービス単位での請求ルール定義
    const billingRules = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      basePrice: 100000,
      unitPrice: 5000,
      discountRate: 0.1,
    };

    // 請求額計算機能を実行
    const result = calculateBillingAmount({
      salesAchievementData,
      billingRules,
    });

    // 計算結果の請求額を取得・検証
    // 営業成果数0件の場合、基本料金0円 + 成果報酬(0件 × 単価)0円 - 割引0円 = 0円
    expect(result.totalAmount).toBe(0);
    expect(result.baseAmount).toBe(0);
    expect(result.performanceRewardAmount).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.customerId).toBe('CUST001');
    expect(result.serviceId).toBe('SVC001');
  });
});
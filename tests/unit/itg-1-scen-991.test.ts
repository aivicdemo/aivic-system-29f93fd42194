import { detectBillingRuleContradiction } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-991: [error] 請求ルール変更時の遡及適用判定機能 - 変更前の契約に基づく請求データとの矛盾が検出される
  test('should detect contradiction when retroactive billing rule change is applied to past contract period', () => {
    const legacyBillingRule = {
      ruleId: 'rule_2024_01',
      appliedPeriodStart: '2024-01-01',
      appliedPeriodEnd: '2024-03-31',
      baseCharge: 50000,
      performanceBonus: 10000,
      discountRate: 0.1,
    };

    const legacyBillingData = {
      contractId: 'contract_abc123',
      billingMonth: '2024-02',
      appliedRuleId: 'rule_2024_01',
      baseAmount: 50000,
      bonusAmount: 10000,
      discountAmount: 6000,
      totalBillingAmount: 54000,
    };

    const newBillingRule = {
      ruleId: 'rule_2024_02',
      appliedPeriodStart: '2024-02-01',
      appliedPeriodEnd: '2024-12-31',
      baseCharge: 60000,
      performanceBonus: 15000,
      discountRate: 0.15,
      retroactiveApplied: true,
      retroactiveStartDate: '2024-02-01',
    };

    const retroactiveBillingCalculation = {
      contractId: 'contract_abc123',
      billingMonth: '2024-02',
      appliedRuleId: 'rule_2024_02',
      baseAmount: 60000,
      bonusAmount: 15000,
      discountAmount: 11250,
      totalBillingAmount: 63750,
    };

    const result = detectBillingRuleContradiction({
      legacyRule: legacyBillingRule,
      legacyBillingData,
      newRule: newBillingRule,
      retroactiveBillingCalculation,
      contractId: 'contract_abc123',
      billingMonth: '2024-02',
    });

    expect(result.hasContradiction).toBe(true);
    expect(result.contradictionType).toBe('retroactive_amount_mismatch');
    expect(result.previousAmount).toBe(54000);
    expect(result.recalculatedAmount).toBe(63750);
    expect(result.amountDifference).toBe(9750);
    expect(result.affectedFields).toEqual([
      'baseAmount',
      'bonusAmount',
      'discountAmount',
      'totalBillingAmount',
    ]);
    expect(result.message).toMatch(/矛盾エラー/);
    expect(result.message).toMatch(/遡及適用/);
    expect(result.message).toMatch(/過去の請求データ/);
    expect(result.details).toEqual({
      previousRuleId: 'rule_2024_01',
      newRuleId: 'rule_2024_02',
      retroactiveStartDate: '2024-02-01',
      contractPeriodStart: '2024-01-01',
      contractPeriodEnd: '2024-03-31',
      targetBillingMonth: '2024-02',
    });
  });
});
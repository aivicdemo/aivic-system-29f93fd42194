import { calculateDiscountByPriority } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-941: [normal] 契約別割引基準の確認機能 - 複数の割引ルールが適用可能な場合、優先順位に基づき正しい割引が選択される
  test('複数の割引ルールが適用可能な場合、優先順位ルールに基づいて最優先度の割引ルールのみを正しく選択し、その割引率が正確に計算・表示される', () => {
    // パターン1: 顧客ランク割引（優先度1）> 数量割引（優先度2）> キャンペーン割引（優先度3）
    // 顧客ランク割引が最優先なので、顧客ランク割引 10% が選択される
    const result1 = calculateDiscountByPriority({
      contractId: 'CONTRACT-001',
      customerId: 'CUST-001',
      customerRank: 'GOLD',
      quantity: 100,
      unitPrice: 10000,
      campaignCode: 'CAMPAIGN-A',
      applicableDiscountRules: [
        {
          ruleId: 'RULE-RANK-001',
          ruleName: '顧客ランク割引',
          priority: 1,
          discountRate: 0.1,
          condition: { customerRank: 'GOLD' }
        },
        {
          ruleId: 'RULE-QTY-001',
          ruleName: '数量割引',
          priority: 2,
          discountRate: 0.05,
          condition: { minQuantity: 100 }
        },
        {
          ruleId: 'RULE-CAMP-001',
          ruleName: 'キャンペーン割引',
          priority: 3,
          discountRate: 0.03,
          condition: { campaignCode: 'CAMPAIGN-A' }
        }
      ]
    });

    expect(result1).toEqual({
      selectedRuleId: 'RULE-RANK-001',
      selectedRuleName: '顧客ランク割引',
      selectedPriority: 1,
      appliedDiscountRate: 0.1,
      baseAmount: 1000000,
      discountAmount: 100000,
      finalAmount: 900000
    });

    // パターン2: 数量割引が最優先（優先度1）、顧客ランク割引は優先度2
    // 数量割引 8% が選択される
    const result2 = calculateDiscountByPriority({
      contractId: 'CONTRACT-002',
      customerId: 'CUST-002',
      customerRank: 'SILVER',
      quantity: 150,
      unitPrice: 5000,
      campaignCode: 'CAMPAIGN-B',
      applicableDiscountRules: [
        {
          ruleId: 'RULE-QTY-002',
          ruleName: '数量割引',
          priority: 1,
          discountRate: 0.08,
          condition: { minQuantity: 150 }
        },
        {
          ruleId: 'RULE-RANK-002',
          ruleName: '顧客ランク割引',
          priority: 2,
          discountRate: 0.05,
          condition: { customerRank: 'SILVER' }
        },
        {
          ruleId: 'RULE-CAMP-002',
          ruleName: 'キャンペーン割引',
          priority: 3,
          discountRate: 0.02,
          condition: { campaignCode: 'CAMPAIGN-B' }
        }
      ]
    });

    expect(result2).toEqual({
      selectedRuleId: 'RULE-QTY-002',
      selectedRuleName: '数量割引',
      selectedPriority: 1,
      appliedDiscountRate: 0.08,
      baseAmount: 750000,
      discountAmount: 60000,
      finalAmount: 690000
    });

    // パターン3: キャンペーン割引が最優先（優先度1）
    // キャンペーン割引 12% が選択される
    const result3 = calculateDiscountByPriority({
      contractId: 'CONTRACT-003',
      customerId: 'CUST-003',
      customerRank: 'BRONZE',
      quantity: 50,
      unitPrice: 20000,
      campaignCode: 'CAMPAIGN-PREMIUM',
      applicableDiscountRules: [
        {
          ruleId: 'RULE-CAMP-003',
          ruleName: 'キャンペーン割引',
          priority: 1,
          discountRate: 0.12,
          condition: { campaignCode: 'CAMPAIGN-PREMIUM' }
        },
        {
          ruleId: 'RULE-RANK-003',
          ruleName: '顧客ランク割引',
          priority: 2,
          discountRate: 0.03,
          condition: { customerRank: 'BRONZE' }
        },
        {
          ruleId: 'RULE-QTY-003',
          ruleName: '数量割引',
          priority: 3,
          discountRate: 0.02,
          condition: { minQuantity: 50 }
        }
      ]
    });

    expect(result3).toEqual({
      selectedRuleId: 'RULE-CAMP-003',
      selectedRuleName: 'キャンペーン割引',
      selectedPriority: 1,
      appliedDiscountRate: 0.12,
      baseAmount: 1000000,
      discountAmount: 120000,
      finalAmount: 880000
    });

    // パターン4: 優先度が同じ複数ルール（期待値: 最初に定義されたルールが選択される）
    // 優先度1で複数ルールがある場合、配列の最初の要素（RULE-A）が選択される
    const result4 = calculateDiscountByPriority({
      contractId: 'CONTRACT-004',
      customerId: 'CUST-004',
      customerRank: 'PLATINUM',
      quantity: 200,
      unitPrice: 8000,
      campaignCode: 'CAMPAIGN-C',
      applicableDiscountRules: [
        {
          ruleId: 'RULE-A',
          ruleName: 'ルールA',
          priority: 1,
          discountRate: 0.15,
          condition: { customerRank: 'PLATINUM' }
        },
        {
          ruleId: 'RULE-B',
          ruleName: 'ルールB',
          priority: 1,
          discountRate: 0.14,
          condition: { minQuantity: 200 }
        }
      ]
    });

    expect(result4).toEqual({
      selectedRuleId: 'RULE-A',
      selectedRuleName: 'ルールA',
      selectedPriority: 1,
      appliedDiscountRate: 0.15,
      baseAmount: 1600000,
      discountAmount: 240000,
      finalAmount: 1360000
    });

    // パターン5: 優先度のない場合（期待値: エラーまたはデフォルト割引率0）
    // 適用可能な割引ルールが空の場合、割引なし（割引率0）で計算される
    const result5 = calculateDiscountByPriority({
      contractId: 'CONTRACT-005',
      customerId: 'CUST-005',
      customerRank: 'STANDARD',
      quantity: 10,
      unitPrice: 3000,
      campaignCode: null,
      applicableDiscountRules: []
    });

    expect(result5).toEqual({
      selectedRuleId: null,
      selectedRuleName: 'なし',
      selectedPriority: null,
      appliedDiscountRate: 0,
      baseAmount: 30000,
      discountAmount: 0,
      finalAmount: 30000
    });
  });
});
import { extractBillingItems } from '../../src/logic/it-1-2-1';

describe('営業データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1037: 請求対象項目の抽出ルール定義が不完全な場合、エラーとして通知される', () => {
    // 不完全なルール定義（ルール名が未入力）
    const incompleteRuleWithoutName = {
      rule_name: '',
      extraction_condition: 'service_type = "営業支援"',
      billing_amount_formula: 'apo_count * 1000 + contract_count * 5000',
      discount_rate: 0.1,
      minimum_billing_amount: 10000,
    };

    expect(() => extractBillingItems(incompleteRuleWithoutName)).toThrow(/ルール名/);

    // 不完全なルール定義（抽出条件が未入力）
    const incompleteRuleWithoutCondition = {
      rule_name: '営業支援サービス請求ルール',
      extraction_condition: '',
      billing_amount_formula: 'apo_count * 1000 + contract_count * 5000',
      discount_rate: 0.1,
      minimum_billing_amount: 10000,
    };

    expect(() => extractBillingItems(incompleteRuleWithoutCondition)).toThrow(/抽出条件/);

    // 不完全なルール定義（請求金額計算式が未入力）
    const incompleteRuleWithoutFormula = {
      rule_name: '営業支援サービス請求ルール',
      extraction_condition: 'service_type = "営業支援"',
      billing_amount_formula: '',
      discount_rate: 0.1,
      minimum_billing_amount: 10000,
    };

    expect(() => extractBillingItems(incompleteRuleWithoutFormula)).toThrow(/計算式/);

    // 完全なルール定義の場合、エラーが発生しない
    const completeRule = {
      rule_name: '営業支援サービス請求ルール',
      extraction_condition: 'service_type = "営業支援"',
      billing_amount_formula: 'apo_count * 1000 + contract_count * 5000',
      discount_rate: 0.1,
      minimum_billing_amount: 10000,
    };

    const result = extractBillingItems(completeRule);
    expect(result).toEqual({
      rule_id: expect.any(String),
      rule_name: '営業支援サービス請求ルール',
      extraction_condition: 'service_type = "営業支援"',
      billing_amount_formula: 'apo_count * 1000 + contract_count * 5000',
      discount_rate: 0.1,
      minimum_billing_amount: 10000,
      created_at: expect.any(String),
      status: 'saved',
    });
  });
});
import { validateContractChangeCompliance } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-1238: 契約変更内容のルール適合性判定機能 - 変更前後の契約条件がすべてのルール（契約ルール、請求ルール、納期要件）に適合する場合、承認可と判定される', () => {
    // テストデータ: 契約変更前の契約情報
    const before_contract = {
      contract_id: 'CNT-2024-001',
      customer_id: 'CUST-123',
      service_type: 'standard',
      monthly_fee: 100000,
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
      minimum_contract_period_months: 12,
      delivery_date: '2024-06-30',
      payment_terms_days: 30,
      discount_rate: 0,
    };

    // テストデータ: 契約変更後の契約情報
    const after_contract = {
      contract_id: 'CNT-2024-001',
      customer_id: 'CUST-123',
      service_type: 'standard',
      monthly_fee: 120000,
      contract_start_date: '2024-01-01',
      contract_end_date: '2025-12-31',
      minimum_contract_period_months: 12,
      delivery_date: '2025-06-30',
      payment_terms_days: 30,
      discount_rate: 0.05,
    };

    // 契約ルール定義: 最低契約期間12ヶ月、料金レンジ 50,000 ～ 500,000/月
    const contract_rules = {
      min_contract_period_months: 12,
      min_monthly_fee: 50000,
      max_monthly_fee: 500000,
    };

    // 請求ルール定義: 請求周期30日、支払条件30日以内
    const billing_rules = {
      billing_cycle_days: 30,
      max_payment_terms_days: 30,
      allowed_discount_rates: [0, 0.05, 0.1, 0.15],
    };

    // 納期要件定義: リードタイムは契約開始から6ヶ月以上
    const delivery_requirements = {
      min_leadtime_months: 6,
    };

    // ルール適合性判定機能を実行
    const result = validateContractChangeCompliance(
      before_contract,
      after_contract,
      contract_rules,
      billing_rules,
      delivery_requirements,
    );

    // 期待結果の検証
    expect(result).toEqual({
      approval_status: '承認可',
      is_compliant: true,
      contract_rule_check: true,
      billing_rule_check: true,
      delivery_requirement_check: true,
      message: '変更前後の契約条件がすべてのルール（契約ルール、請求ルール、納期要件）に適合しています。',
    });
  });
});
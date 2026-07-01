import { validateContractChangeCompliance } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1239: [error] 契約変更内容のルール適合性判定機能 - 変更内容が契約ルールに違反する場合、適合判定エラーが返される
  test('契約ルール違反時に適合判定エラーが返される', () => {
    const existing_contract = {
      contract_id: 'CONTRACT-001',
      customer_id: 'CUST-001',
      min_contract_duration_months: 12,
      max_price_change_ratio: 0.2,
      current_start_date: '2024-01-01',
      current_end_date: '2024-12-31',
      current_monthly_price: 100000,
    };

    const contract_rules = {
      min_contract_duration_months: 12,
      max_price_change_ratio: 0.2,
      allowed_price_increase_ratio: 0.15,
      allowed_price_decrease_ratio: 0.1,
    };

    // 最小契約期間違反ケース（8ヶ月への変更、ルールは12ヶ月以上）
    const violation_change_short_duration = {
      contract_id: 'CONTRACT-001',
      new_start_date: '2024-06-01',
      new_end_date: '2025-02-01',
      new_monthly_price: 100000,
      change_reason: 'Contract shortening request',
    };

    expect(() => {
      validateContractChangeCompliance(
        existing_contract,
        contract_rules,
        violation_change_short_duration
      );
    }).toThrow(/最小契約期間/);

    // 価格変動制限違反ケース（25%の値上げ、ルール上限は20%）
    const violation_change_excessive_price_increase = {
      contract_id: 'CONTRACT-001',
      new_start_date: '2025-01-01',
      new_end_date: '2025-12-31',
      new_monthly_price: 125000,
      change_reason: 'Price adjustment',
    };

    expect(() => {
      validateContractChangeCompliance(
        existing_contract,
        contract_rules,
        violation_change_excessive_price_increase
      );
    }).toThrow(/価格変動/);

    // 許可される変更ケース（20%の値上げ、制限内）
    const compliant_change_within_limit = {
      contract_id: 'CONTRACT-001',
      new_start_date: '2025-01-01',
      new_end_date: '2026-12-31',
      new_monthly_price: 120000,
      change_reason: 'Contractual price adjustment',
    };

    const result = validateContractChangeCompliance(
      existing_contract,
      contract_rules,
      compliant_change_within_limit
    );

    expect(result).toEqual({
      is_compliant: true,
      violations: [],
      contract_id: 'CONTRACT-001',
      new_contract_duration_months: 24,
      price_change_ratio: 0.2,
      status: '許可',
    });
  });
});
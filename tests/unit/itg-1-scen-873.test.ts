import { validateContractChangeValidity } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-873: [edge] 契約変更妥当性判定機能 - 契約変更後の請求額が契約上の上限値と下限値の境界値である場合に正確に判定される
  test('契約変更妥当性判定機能が上限値・下限値の境界値に対して正確に判定する', () => {
    const contract_id = 'C001';
    const upper_limit = 100000;
    const lower_limit = 10000;

    // ケース1: 上限値（100,000円）での判定 → true を期待
    const result_at_upper_limit = validateContractChangeValidity({
      contract_id,
      upper_limit,
      lower_limit,
      new_billing_amount: 100000,
    });
    expect(result_at_upper_limit).toBe(true);

    // ケース2: 下限値（10,000円）での判定 → true を期待
    const result_at_lower_limit = validateContractChangeValidity({
      contract_id,
      upper_limit,
      lower_limit,
      new_billing_amount: 10000,
    });
    expect(result_at_lower_limit).toBe(true);

    // ケース3: 上限値超過（100,000.01円）での判定 → false を期待
    const result_above_upper_limit = validateContractChangeValidity({
      contract_id,
      upper_limit,
      lower_limit,
      new_billing_amount: 100000.01,
    });
    expect(result_above_upper_limit).toBe(false);

    // ケース4: 下限値未満（9,999.99円）での判定 → false を期待
    const result_below_lower_limit = validateContractChangeValidity({
      contract_id,
      upper_limit,
      lower_limit,
      new_billing_amount: 9999.99,
    });
    expect(result_below_lower_limit).toBe(false);

    // ケース5: 範囲内の中間値での判定 → true を期待
    const result_within_range = validateContractChangeValidity({
      contract_id,
      upper_limit,
      lower_limit,
      new_billing_amount: 50000,
    });
    expect(result_within_range).toBe(true);
  });
});
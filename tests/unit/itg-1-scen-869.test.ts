import { validateContractChangeConsistency } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約変更前後の整合性検証', () => {
  // SCEN-869: [error] 契約変更前後の整合性検証機能 - 契約変更によって請求額が不合理に増減した場合に誤りとして検出される
  test('契約変更によって請求額が50倍以上増加または90%以上削減された場合、エラーを検出する', () => {
    // ケース1: 月額請求額が10,000円から500,000円に増加（50倍）
    const contract_change_1 = {
      contract_id: 'CONTRACT_001',
      monthly_billing_before: 10000,
      monthly_billing_after: 500000,
    };

    const result_1 = validateContractChangeConsistency(contract_change_1);

    expect(result_1.is_valid).toBe(false);
    expect(result_1.error_code).toBe('UNREASONABLE_AMOUNT_INCREASE');
    expect(result_1.error_message).toMatch(/不合理な増加/);
    expect(result_1.change_rate_percentage).toBe(5000);
    expect(result_1.amount_difference).toBe(490000);

    // ケース2: 月額請求額が100,000円から1,000円に削減（99%削減）
    const contract_change_2 = {
      contract_id: 'CONTRACT_002',
      monthly_billing_before: 100000,
      monthly_billing_after: 1000,
    };

    const result_2 = validateContractChangeConsistency(contract_change_2);

    expect(result_2.is_valid).toBe(false);
    expect(result_2.error_code).toBe('UNREASONABLE_AMOUNT_DECREASE');
    expect(result_2.error_message).toMatch(/不合理な削減/);
    expect(result_2.change_rate_percentage).toBe(-99);
    expect(result_2.amount_difference).toBe(-99000);

    // ケース3: 正常な変更（10%の増加は許容範囲内）
    const contract_change_3 = {
      contract_id: 'CONTRACT_003',
      monthly_billing_before: 100000,
      monthly_billing_after: 110000,
    };

    const result_3 = validateContractChangeConsistency(contract_change_3);

    expect(result_3.is_valid).toBe(true);
    expect(result_3.error_code).toBeNull();
    expect(result_3.change_rate_percentage).toBe(10);
    expect(result_3.amount_difference).toBe(10000);

    // ケース4: 正常な変更（5%の削減は許容範囲内）
    const contract_change_4 = {
      contract_id: 'CONTRACT_004',
      monthly_billing_before: 100000,
      monthly_billing_after: 95000,
    };

    const result_4 = validateContractChangeConsistency(contract_change_4);

    expect(result_4.is_valid).toBe(true);
    expect(result_4.error_code).toBeNull();
    expect(result_4.change_rate_percentage).toBe(-5);
    expect(result_4.amount_difference).toBe(-5000);
  });
});
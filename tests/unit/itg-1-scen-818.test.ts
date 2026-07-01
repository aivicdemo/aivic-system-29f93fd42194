import { validateBillingDataConsistency } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  test('SCEN-818: 請求金額が契約条件と不一致の場合に警告が表示される', () => {
    // 契約条件の設定：契約金額100,000円、請求周期月次、割引率10%
    // 期待される請求金額：100,000円 × (1 - 10%) = 90,000円
    const contract_amount = 100000;
    const discount_rate = 0.1;
    const expected_billing_amount = contract_amount * (1 - discount_rate);

    // 請求データ：95,000円（契約条件から計算される90,000円と不一致）
    const submitted_billing_amount = 95000;

    const input = {
      contract_amount: contract_amount,
      discount_rate: discount_rate,
      submitted_billing_amount: submitted_billing_amount,
      billing_cycle: 'monthly',
    };

    const result = validateBillingDataConsistency(input);

    // 期待結果の検証
    expect(result.is_valid).toBe(false);
    expect(result.validation_status).toBe('warning');
    expect(result.expected_billing_amount).toBe(90000);
    expect(result.discrepancy_amount).toBe(5000); // 95,000 - 90,000 = 5,000
    expect(result.warning_message).toMatch(/請求金額が契約条件と一致しません/);
    expect(result.warning_message).toMatch(/契約金額.*100,000/);
    expect(result.warning_message).toMatch(/割引率.*10%/);
    expect(result.warning_message).toMatch(/90,000円/);
  });
});
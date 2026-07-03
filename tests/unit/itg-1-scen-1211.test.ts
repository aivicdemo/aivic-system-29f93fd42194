import { validateContractChangeComplianceWithBillingRules } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1211: [error] 契約変更内容の契約・請求・納期ルール適合判定 - 変更内容が請求ルールに違反する場合、違反項目を特定し承認不可と判定される
  test('請求ルール違反検出時に、違反項目が特定されて詳細に表示され、承認が不可と判定されること', () => {
    const existingContract = {
      contract_id: 'CTR-001',
      customer_id: 'CUST-001',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      base_amount: 100000,
      billing_cycle: 'monthly',
      billing_start_date: '2024-01-15',
    };

    const changeContent = {
      contract_id: 'CTR-001',
      billing_date: '2023-12-15',
      billing_amount: 150000,
      billing_cycle: 'invalid_cycle',
    };

    const result = validateContractChangeComplianceWithBillingRules(existingContract, changeContent);

    expect(result.is_approved).toBe(false);
    expect(result.violations).toHaveLength(3);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          violation_rule: '請求開始日契約開始日ルール',
          violation_location: 'billing_date',
          violation_detail: '請求開始日が契約開始日（2024-01-01）より前の日付（2023-12-15）に設定されています',
          recommended_fix: '請求開始日を契約開始日以降に修正してください',
        }),
        expect.objectContaining({
          violation_rule: '請求額契約金額ルール',
          violation_location: 'billing_amount',
          violation_detail: '請求額（150000円）が契約金額（100000円）を超過しています',
          recommended_fix: '請求額を契約金額以下に修正してください',
        }),
        expect.objectContaining({
          violation_rule: '請求周期値ルール',
          violation_location: 'billing_cycle',
          violation_detail: '請求周期（invalid_cycle）が不正な値です。許可される値は monthly, quarterly, annual です',
          recommended_fix: '請求周期を月次、四半期、年次のいずれかに修正してください',
        }),
      ])
    );
    expect(result.approval_button_disabled).toBe(true);
    expect(result.error_message).toMatch(/請求ルール/);
  });
});
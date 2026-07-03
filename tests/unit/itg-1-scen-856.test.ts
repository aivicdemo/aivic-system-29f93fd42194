import { validateContractChangeValidity } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約変更妥当性判定機能', () => {
  // SCEN-856: [normal] 契約変更妥当性判定機能 - 変更前後の整合性検証結果に基づき妥当性が正常に判定され承認結果が出力される
  test('変更前後の契約データの整合性を検証し、妥当性判定と承認結果が正確に出力される', () => {
    // ハッピーパス：承認ケース
    const approval_input = {
      contract_id: 'C001',
      customer_id: 'CUST-2024-001',
      change_before: {
        amount: 1000000,
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        customer_name: 'テスト顧客A',
        service_type: 'basic',
      },
      change_after: {
        amount: 1100000,
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        customer_name: 'テスト顧客A',
        service_type: 'basic',
      },
      change_reason: '業績向上に伴う単価改定',
      changed_at: '2024-06-15T09:00:00Z',
    };

    const approval_result = validateContractChangeValidity(approval_input);

    // 検証結果の構造を確認
    expect(approval_result).toHaveProperty('is_valid');
    expect(approval_result).toHaveProperty('validity_checks');
    expect(approval_result).toHaveProperty('approval_status');
    expect(approval_result).toHaveProperty('validation_details');

    // 金額妥当性チェック：変更前の1,000,000円から1,100,000円への10%増加は妥当
    expect(approval_result.validity_checks).toHaveProperty('amount_validity');
    expect(approval_result.validity_checks.amount_validity).toBe(true);

    // 契約期間の論理性チェック：期間は変わらない（同年度継続）
    expect(approval_result.validity_checks).toHaveProperty('period_logic');
    expect(approval_result.validity_checks.period_logic).toBe(true);

    // 顧客情報の一致性チェック：顧客ID・名前・サービス種別が変わらない
    expect(approval_result.validity_checks).toHaveProperty('customer_consistency');
    expect(approval_result.validity_checks.customer_consistency).toBe(true);

    // 変更理由の妥当性チェック：理由が妥当
    expect(approval_result.validity_checks).toHaveProperty('change_reason_validity');
    expect(approval_result.validity_checks.change_reason_validity).toBe(true);

    // すべてのチェックが通っているため、全体検証は真
    expect(approval_result.is_valid).toBe(true);

    // 妥当性判定エンジンの結果：承認
    expect(approval_result.approval_status).toBe('approved');

    // 検証詳細にはすべてのチェック結果が記録される
    expect(approval_result.validation_details).toHaveProperty('amount_change_percent');
    expect(approval_result.validation_details.amount_change_percent).toBe(10);

    expect(approval_result.validation_details).toHaveProperty('period_duration_days');
    expect(approval_result.validation_details.period_duration_days).toBe(365);

    // 却下ケース：不合理な金額変更
    const rejection_input = {
      contract_id: 'C002',
      customer_id: 'CUST-2024-002',
      change_before: {
        amount: 1000000,
        period_start: '2024-01-01',
        period_end: '2024-12-31',
        customer_name: 'テスト顧客B',
        service_type: 'premium',
      },
      change_after: {
        amount: 500000,
        period_start: '2024-01-01',
        period_end: '2023-12-31',
        customer_name: 'テスト顧客B',
        service_type: 'premium',
      },
      change_reason: '理由なし',
      changed_at: '2024-06-15T10:00:00Z',
    };

    const rejection_result = validateContractChangeValidity(rejection_input);

    // 期間が矛盾している（終了日が開始日より前）
    expect(rejection_result.validity_checks.period_logic).toBe(false);

    // 金額が50%削減（不合理な変更）
    expect(rejection_result.validity_checks.amount_validity).toBe(false);

    // 変更理由が妥当でない
    expect(rejection_result.validity_checks.change_reason_validity).toBe(false);

    // 全体検証は偽
    expect(rejection_result.is_valid).toBe(false);

    // 妥当性判定エンジンの結果：却下
    expect(rejection_result.approval_status).toBe('rejected');

    // 検証詳細に却下理由が記録される
    expect(rejection_result.validation_details).toHaveProperty('rejection_reasons');
    expect(Array.isArray(rejection_result.validation_details.rejection_reasons)).toBe(true);
    expect(rejection_result.validation_details.rejection_reasons.length).toBeGreaterThan(0);

    // 契約変更履歴に記録されるための属性が存在
    expect(approval_result).toHaveProperty('recorded_at');
    expect(rejection_result).toHaveProperty('recorded_at');

    // 複数パターンの検証が一貫性を持って実行される
    const moderate_change_input = {
      contract_id: 'C003',
      customer_id: 'CUST-2024-003',
      change_before: {
        amount: 500000,
        period_start: '2024-04-01',
        period_end: '2025-03-31',
      },
      change_after: {
        amount: 525000,
        period_start: '2024-04-01',
        period_end: '2025-03-31',
      },
      change_reason: '通常の年次料金改定',
      changed_at: '2024-06-15T11:00:00Z',
    };

    const moderate_result = validateContractChangeValidity(moderate_change_input);

    // 5%の妥当な増加
    expect(moderate_result.validity_checks.amount_validity).toBe(true);
    expect(moderate_result.validity_checks.period_logic).toBe(true);
    expect(moderate_result.is_valid).toBe(true);
    expect(moderate_result.approval_status).toBe('approved');
  });
});
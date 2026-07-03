import { validateAndApproveBusinessData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-723: [normal] 営業データ品質基準チェック・承認機能 - 修正済みデータのすべての必須項目と形式が正確で、承認済みステータスに遷移する
  test('修正済みデータがすべての品質基準チェックに合格し、ステータスが承認済みに遷移することを確認', () => {
    const correctedBusinessData = {
      customer_name: '株式会社テスト',
      contact_date: '2024-01-15',
      sales_amount: 150000.50,
      appointment_status: 'confirmed',
      service_type: 'basic_plan',
      contact_email: 'contact@test-company.jp',
      phone_number: '09012345678',
      notes: '修正完了データ',
      data_entry_user_id: 'user_001',
      entry_timestamp: '2024-01-15T10:30:00Z',
    };

    const result = validateAndApproveBusinessData(correctedBusinessData);

    // 品質基準チェックに合格していることを確認
    expect(result.validation_status).toBe('passed');

    // すべての必須項目が存在することを確認
    expect(result.required_fields_check).toBe(true);

    // すべての必須項目が正確に入力されていることを確認
    expect(result.missing_fields).toEqual([]);

    // データ形式が基準に準拠していることを確認
    expect(result.format_validation_status).toBe('valid');

    // メールアドレス形式が正確であることを確認
    expect(result.email_format_valid).toBe(true);

    // 電話番号形式が正確であることを確認
    expect(result.phone_format_valid).toBe(true);

    // 金額の数値形式が正確であることを確認
    expect(result.amount_format_valid).toBe(true);

    // チェック結果が合格であることを検証
    expect(result.overall_check_result).toBe('pass');

    // ステータスが承認待ちから承認済みに遷移したことを確認
    expect(result.approval_status).toBe('approved');

    // 承認タイムスタンプが記録されていることを確認
    expect(result.approval_timestamp).toBeDefined();
    expect(typeof result.approval_timestamp).toBe('string');

    // システムログに承認記録が正常に記録されていることを確認
    expect(result.system_log_entry).toBeDefined();
    expect(result.system_log_entry.action).toBe('approval');
    expect(result.system_log_entry.status).toBe('recorded');
    expect(result.system_log_entry.timestamp).toBeDefined();

    // データがパイプラインに登録可能な状態であることを確認
    expect(result.ready_for_billing_pipeline).toBe(true);

    // チェック内容の詳細が記録されていることを確認
    expect(result.validation_details).toBeDefined();
    expect(result.validation_details.length).toBeGreaterThan(0);
    expect(result.validation_details).toContain('customer_name validated');
    expect(result.validation_details).toContain('contact_date validated');
    expect(result.validation_details).toContain('sales_amount validated');
    expect(result.validation_details).toContain('appointment_status validated');
  });
});
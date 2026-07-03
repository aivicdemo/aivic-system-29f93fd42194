import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1106: [error] 異常値・欠落データ自動検出 - 欠落データが存在する場合に該当項目と理由を通知される
  test('should detect missing fields and notify with field names and reasons when validation is executed', () => {
    // 入力: 欠落データを含むテストデータセット
    const input_sales_data = {
      customer_id: 'CUST001',
      customer_name: 'テスト顧客A',
      service_id: 'SVC001',
      service_name: '', // 欠落: 空文字列
      contact_date: '2024-01-15',
      contact_time: '', // 欠落: 連絡時間がない
      appointment_count: 5,
      appointment_status: 'confirmed',
      contract_amount: '', // 欠落: 契約金額がない
      contact_response: 'positive',
      data_entry_date: '2024-01-15T09:00:00Z',
    };

    // 必須項目の検証ルール定義
    const validation_rules = {
      customer_id: { required: true, type: 'string', reason: '顧客ID' },
      customer_name: { required: true, type: 'string', reason: '顧客名' },
      service_id: { required: true, type: 'string', reason: 'サービスID' },
      service_name: { required: true, type: 'string', reason: 'サービス名' },
      contact_date: { required: true, type: 'string', reason: '接触日' },
      contact_time: { required: true, type: 'string', reason: '接触時間' },
      appointment_count: { required: true, type: 'number', reason: 'アポ数' },
      appointment_status: { required: true, type: 'string', reason: 'アポ確定状況' },
      contract_amount: { required: true, type: 'number', reason: '契約金額' },
      contact_response: { required: true, type: 'string', reason: '顧客反応' },
    };

    // 検証処理を実行
    const validation_result = validateSalesDataQuality(input_sales_data, validation_rules);

    // 欠落データが検出されたことを確認
    expect(validation_result.is_valid).toBe(false);

    // 検出されたエラー数が 3 件であることを確認（service_name, contact_time, contract_amount）
    expect(validation_result.validation_errors).toBeDefined();
    expect(validation_result.validation_errors.length).toBe(3);

    // 第 1 のエラー: service_name 欠落
    expect(validation_result.validation_errors[0]).toEqual({
      field_name: 'service_name',
      field_label: 'サービス名',
      error_type: 'missing_field',
      error_reason: 'サービス名は必須項目です。入力してください。',
      severity: 'error',
    });

    // 第 2 のエラー: contact_time 欠落
    expect(validation_result.validation_errors[1]).toEqual({
      field_name: 'contact_time',
      field_label: '接触時間',
      error_type: 'missing_field',
      error_reason: '接触時間は必須項目です。入力してください。',
      severity: 'error',
    });

    // 第 3 のエラー: contract_amount 欠落
    expect(validation_result.validation_errors[2]).toEqual({
      field_name: 'contract_amount',
      field_label: '契約金額',
      error_type: 'missing_field',
      error_reason: '契約金額は必須項目です。入力してください。',
      severity: 'error',
    });

    // 通知情報が生成されたことを確認
    expect(validation_result.notification_message).toBeDefined();
    expect(validation_result.notification_message.notification_type).toBe('validation_error');
    expect(validation_result.notification_message.target_user_role).toBe('sales_operator');
    expect(validation_result.notification_message.priority).toBe('high');

    // 通知内容に欠落した項目名が含まれていることを確認
    expect(validation_result.notification_message.message_body).toContain('サービス名');
    expect(validation_result.notification_message.message_body).toContain('接触時間');
    expect(validation_result.notification_message.message_body).toContain('契約金額');

    // 処理タイムスタンプが記録されたことを確認
    expect(validation_result.validation_timestamp).toBeDefined();
    expect(typeof validation_result.validation_timestamp).toBe('string');

    // ユーザーが対応を取るべき内容が通知されたことを確認
    expect(validation_result.notification_message.action_required).toBe(true);
    expect(validation_result.notification_message.suggested_action).toBe('missing_fields_correction');

    // 完全性チェック: 欠落データが 3 件すべて検出・通知されたか
    const detected_missing_fields = validation_result.validation_errors
      .filter((error: any) => error.error_type === 'missing_field')
      .map((error: any) => error.field_name);
    expect(detected_missing_fields).toContain('service_name');
    expect(detected_missing_fields).toContain('contact_time');
    expect(detected_missing_fields).toContain('contract_amount');
  });
});
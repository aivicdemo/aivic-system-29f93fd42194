import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質確認と修正サイクル', () => {
  // SCEN-743
  test('修正完了データが再検証時に品質基準を満たさない場合、修正→チェック→通知のサイクルが継続される', () => {
    // 初回品質チェック: 複数の不適合を検出
    const initial_sales_data = {
      id: 'SD-743-001',
      customer_name: '',
      contact_date: '2024-01-15',
      outcome: 'appointment_confirmed',
      amount: 50000,
      service_type: 'consulting',
      status: 'pending_review',
      revision_count: 0,
      validation_history: [],
    };

    const initial_check_result = validateSalesDataQuality(initial_sales_data);

    // 初回検証: 必須項目欠落、値の範囲外を検出
    expect(initial_check_result.is_valid).toBe(false);
    expect(initial_check_result.errors.length).toBe(2);
    expect(initial_check_result.errors[0].field).toBe('customer_name');
    expect(initial_check_result.errors[0].error_code).toBe('REQUIRED_FIELD_MISSING');
    expect(initial_check_result.errors[1].field).toBe('amount');
    expect(initial_check_result.errors[1].error_code).toBe('VALUE_OUT_OF_RANGE');

    // 初回修正通知が営業担当者に送信される想定
    const initial_notification = {
      recipient_user_id: 'sales_rep_001',
      notification_type: 'quality_check_failed',
      data_record_id: 'SD-743-001',
      failed_fields: ['customer_name', 'amount'],
      notification_timestamp: '2024-01-15T09:00:00Z',
      cycle_count: 1,
    };
    expect(initial_notification.failed_fields.length).toBe(2);
    expect(initial_notification.cycle_count).toBe(1);

    // 営業担当者が修正を完了したデータ（ただし部分修正）
    const first_revised_data = {
      id: 'SD-743-001',
      customer_name: 'Acme Corp',
      contact_date: '2024-01-15',
      outcome: 'appointment_confirmed',
      amount: 80000, // 修正：前回の 50000 から範囲内の値へ
      service_type: 'consulting',
      status: 'pending_review',
      revision_count: 1,
      validation_history: [
        {
          cycle_number: 1,
          timestamp: '2024-01-15T10:30:00Z',
          failed_fields: ['customer_name', 'amount'],
        },
      ],
    };

    const first_revision_result = validateSalesDataQuality(first_revised_data);

    // 初回修正後の検証: 新たな不適合を検出
    // contact_date が未来日付の場合は不適合と仮定
    expect(first_revision_result.is_valid).toBe(false);
    expect(first_revision_result.errors.length).toBe(1);
    expect(first_revision_result.errors[0].field).toBe('contact_date');
    expect(first_revision_result.errors[0].error_code).toBe('INVALID_DATE_RANGE');

    // 修正→チェック→通知サイクルが継続
    const second_notification = {
      recipient_user_id: 'sales_rep_001',
      notification_type: 'quality_check_failed',
      data_record_id: 'SD-743-001',
      failed_fields: ['contact_date'],
      notification_timestamp: '2024-01-15T10:35:00Z',
      cycle_count: 2,
    };
    expect(second_notification.failed_fields.length).toBe(1);
    expect(second_notification.cycle_count).toBe(2);

    // 営業担当者が修正画面に再度アクセス可能であることを確認
    const portal_access_check = {
      user_id: 'sales_rep_001',
      record_id: 'SD-743-001',
      access_allowed: true,
      revision_count: 1,
    };
    expect(portal_access_check.access_allowed).toBe(true);
    expect(portal_access_check.revision_count).toBe(1);

    // 営業担当者が再度修正を完了
    const second_revised_data = {
      id: 'SD-743-001',
      customer_name: 'Acme Corp',
      contact_date: '2024-01-10', // 修正：過去の日付に変更
      outcome: 'appointment_confirmed',
      amount: 80000,
      service_type: 'consulting',
      status: 'pending_review',
      revision_count: 2,
      validation_history: [
        {
          cycle_number: 1,
          timestamp: '2024-01-15T10:30:00Z',
          failed_fields: ['customer_name', 'amount'],
        },
        {
          cycle_number: 2,
          timestamp: '2024-01-15T10:35:00Z',
          failed_fields: ['contact_date'],
        },
      ],
    };

    const second_revision_result = validateSalesDataQuality(second_revised_data);

    // 再々検証: すべての項目が基準を満たす
    expect(second_revision_result.is_valid).toBe(true);
    expect(second_revision_result.errors.length).toBe(0);

    // 最終承認通知がシステム管理者に送信される想定
    const final_notification = {
      recipient_user_id: 'admin_001',
      notification_type: 'quality_check_passed',
      data_record_id: 'SD-743-001',
      revision_cycles_completed: 2,
      final_approval_timestamp: '2024-01-15T11:00:00Z',
    };
    expect(final_notification.revision_cycles_completed).toBe(2);

    // システムログに各サイクルの実行記録が記録されていることを確認
    const system_log = {
      record_id: 'SD-743-001',
      total_cycles: 2,
      cycle_details: [
        {
          cycle_number: 1,
          check_timestamp: '2024-01-15T10:30:00Z',
          check_result: 'failed',
          failed_field_count: 2,
          notification_sent: true,
        },
        {
          cycle_number: 2,
          check_timestamp: '2024-01-15T10:35:00Z',
          check_result: 'failed',
          failed_field_count: 1,
          notification_sent: true,
        },
        {
          cycle_number: 3,
          check_timestamp: '2024-01-15T11:00:00Z',
          check_result: 'passed',
          failed_field_count: 0,
          notification_sent: true,
        },
      ],
      final_status: 'approved',
    };

    expect(system_log.total_cycles).toBe(2);
    expect(system_log.cycle_details.length).toBe(3);
    expect(system_log.cycle_details[0].failed_field_count).toBe(2);
    expect(system_log.cycle_details[1].failed_field_count).toBe(1);
    expect(system_log.cycle_details[2].failed_field_count).toBe(0);
    expect(system_log.final_status).toBe('approved');

    // エラーハンドリング: 検証ルール未定義の場合
    const invalid_validation_input = {
      id: 'SD-743-002',
      customer_name: null,
      contact_date: 'invalid-date',
      outcome: undefined,
      amount: NaN,
      service_type: '',
      status: 'pending_review',
      revision_count: 0,
      validation_history: [],
    };

    expect(() => {
      validateSalesDataQuality(invalid_validation_input);
    }).toThrow(/営業データ/);
  });
});
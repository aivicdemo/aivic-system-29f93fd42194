import { detectContractChange } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1223: [normal] 営業データ変更の自動検知・通知機能 - 契約内容の手動変更が検知され、契約変更管理システムに自動登録される
  test('契約内容の手動変更が即座に検知され、契約変更管理システムに自動登録されること', () => {
    const contract_id = 'CTR-20240115-001';
    const customer_id = 'CUST-0001';
    const changed_by_user_id = 'USR-admin-001';
    const change_timestamp = new Date('2024-01-15T11:30:00Z');

    const before_state = {
      contract_id: contract_id,
      customer_id: customer_id,
      contract_amount: 500000,
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
      contractor_name: '山田太郎',
      contractor_email: 'yamada@example.com',
      contract_status: 'active',
      version: 1,
      last_updated_at: '2024-01-10T09:00:00Z',
      last_updated_by: 'USR-system-001'
    };

    const after_state = {
      contract_id: contract_id,
      customer_id: customer_id,
      contract_amount: 600000,
      contract_start_date: '2024-01-01',
      contract_end_date: '2025-12-31',
      contractor_name: '山田太郎',
      contractor_email: 'yamada@example.com',
      contract_status: 'active',
      version: 2,
      last_updated_at: '2024-01-15T11:30:00Z',
      last_updated_by: changed_by_user_id
    };

    const detection_result = detectContractChange({
      contract_id: contract_id,
      customer_id: customer_id,
      before_state: before_state,
      after_state: after_state,
      changed_by_user_id: changed_by_user_id,
      change_timestamp: change_timestamp
    });

    // (1) 変更内容が契約変更管理システムの履歴に記録されていることを確認
    expect(detection_result.is_change_detected).toBe(true);
    expect(detection_result.change_history_recorded).toBe(true);

    // (2) 変更日時・変更者・変更前後の値が正確に記録されていることを確認
    expect(detection_result.change_details).toEqual({
      contract_id: contract_id,
      customer_id: customer_id,
      change_timestamp: '2024-01-15T11:30:00Z',
      changed_by_user_id: changed_by_user_id,
      changed_fields: [
        {
          field_name: 'contract_amount',
          before_value: 500000,
          after_value: 600000
        },
        {
          field_name: 'contract_end_date',
          before_value: '2024-12-31',
          after_value: '2025-12-31'
        }
      ],
      before_version: 1,
      after_version: 2
    });

    // (3) 関連する通知が適切なタイミングで関係者に送信されていることが確認できること
    expect(detection_result.notifications_sent).toBe(true);
    expect(detection_result.notification_list).toEqual([
      {
        notification_id: expect.any(String),
        recipient_type: 'customer_contact',
        recipient_email: 'yamada@example.com',
        recipient_user_id: expect.any(String),
        notification_status: 'sent',
        sent_timestamp: '2024-01-15T11:30:00Z',
        message_type: 'contract_change_notification',
        change_summary: '契約金額が500000から600000に、契約終了日が2024-12-31から2025-12-31に変更されました。'
      },
      {
        notification_id: expect.any(String),
        recipient_type: 'internal_admin',
        recipient_email: expect.any(String),
        recipient_user_id: 'USR-admin-manager-001',
        notification_status: 'sent',
        sent_timestamp: '2024-01-15T11:30:00Z',
        message_type: 'contract_change_audit_log',
        change_summary: 'ユーザー USR-admin-001 により契約 CTR-20240115-001 が変更されました。'
      }
    ]);

    // 契約変更管理システムに自動登録された履歴レコードの検証
    expect(detection_result.history_record).toEqual({
      change_id: expect.any(String),
      contract_id: contract_id,
      customer_id: customer_id,
      change_type: 'contract_modification',
      changed_by_user_id: changed_by_user_id,
      change_timestamp: '2024-01-15T11:30:00Z',
      before_snapshot: before_state,
      after_snapshot: after_state,
      audit_trail_created: true,
      audit_trail_timestamp: '2024-01-15T11:30:00Z'
    });

    // 変更の重要度判定（金額変更かつ期間延長は「高」）
    expect(detection_result.change_severity).toBe('high');
    expect(detection_result.requires_manual_review).toBe(false);
    expect(detection_result.auto_registration_success).toBe(true);
  });
});
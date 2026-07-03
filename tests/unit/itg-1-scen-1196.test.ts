import { describe, test, expect } from '@jest/globals';
import {
  detectSalesDataChange,
  registerChangeToManagementSystem,
  sendChangeNotification,
} from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1196: [normal] 営業成果データ変更の自動検知・登録機能
  test('営業活動データの入力変更が検知され、契約変更管理システムに自動登録される', () => {
    // 前提: 営業成果データ管理画面にログインし、既存の営業活動データが表示されている
    const sales_activity_before = {
      id: 'ACT-202401-001',
      customer_id: 'CUST-001',
      activity_type: '商談',
      amount: 1000000,
      status: '進捗中',
      updated_at: '2024-01-15T10:00:00Z',
      updated_by: 'user_sales_001',
    };

    const sales_activity_after = {
      id: 'ACT-202401-001',
      customer_id: 'CUST-001',
      activity_type: '商談',
      amount: 1200000, // 金額を 1000000 から 1200000 に変更
      status: '進捗中',
      updated_at: '2024-01-15T11:30:00Z',
      updated_by: 'user_sales_001',
    };

    // ステップ 1: システムが営業活動データの変更を検知する
    const change_detected = detectSalesDataChange(
      sales_activity_before,
      sales_activity_after
    );

    // 期待値: 変更が検知され、変更内容（項目名、変更前後の値）が正確に記録される
    expect(change_detected).toEqual({
      is_changed: true,
      changes: [
        {
          field_name: 'amount',
          before_value: 1000000,
          after_value: 1200000,
          timestamp: '2024-01-15T11:30:00Z',
          changed_by: 'user_sales_001',
        },
      ],
    });

    // ステップ 2: 検知された変更を契約変更管理システムに自動登録する
    const registration_result = registerChangeToManagementSystem({
      activity_id: sales_activity_after.id,
      customer_id: sales_activity_after.customer_id,
      changes: change_detected.changes,
      change_timestamp: sales_activity_after.updated_at,
      changed_by: sales_activity_after.updated_by,
    });

    // 期待値: 変更内容（項目名、変更前後の値、タイムスタンプ、変更者）が正確に登録される
    expect(registration_result).toEqual({
      status: 'registered',
      contract_change_id: expect.stringMatching(/^CHANGE-\d{14}$/),
      registered_at: '2024-01-15T11:30:00Z',
      details: {
        activity_id: 'ACT-202401-001',
        customer_id: 'CUST-001',
        change_records: [
          {
            field_name: 'amount',
            before_value: 1000000,
            after_value: 1200000,
            timestamp: '2024-01-15T11:30:00Z',
            changed_by: 'user_sales_001',
          },
        ],
      },
    });

    // ステップ 3: 関連ステークホルダーへ変更通知を送信する
    const notification_result = sendChangeNotification({
      change_id: registration_result.contract_change_id,
      customer_id: sales_activity_after.customer_id,
      change_summary: `営업活動「${sales_activity_after.activity_type}」の金額が ${sales_activity_before.amount} から ${sales_activity_after.amount} に変更されました。`,
      timestamp: sales_activity_after.updated_at,
      recipients: [
        {
          user_id: 'user_customer_manager_001',
          user_type: 'customer_manager',
          email: 'manager@customer.example.com',
        },
        {
          user_id: 'user_admin_001',
          user_type: 'admin',
          email: 'admin@company.example.com',
        },
      ],
    });

    // 期待値: 関連ユーザーへの変更通知が正常に送信される
    expect(notification_result).toEqual({
      status: 'notification_sent',
      sent_at: '2024-01-15T11:30:00Z',
      recipients_notified: 2,
      notification_log: [
        {
          recipient_id: 'user_customer_manager_001',
          recipient_type: 'customer_manager',
          delivery_status: 'delivered',
          delivered_at: '2024-01-15T11:30:05Z',
        },
        {
          recipient_id: 'user_admin_001',
          recipient_type: 'admin',
          delivery_status: 'delivered',
          delivered_at: '2024-01-15T11:30:05Z',
        },
      ],
    });

    // ステップ 4: 変更履歴ログが正確に記録されていることを確認
    expect(registration_result.details.change_records).toHaveLength(1);
    expect(registration_result.details.change_records[0]).toMatchObject({
      field_name: 'amount',
      before_value: 1000000,
      after_value: 1200000,
      timestamp: '2024-01-15T11:30:00Z',
    });

    // ステップ 5: タイムスタンプと変更者情報が正確に記録されていることを確認
    expect(registration_result.registered_at).toBe('2024-01-15T11:30:00Z');
    expect(registration_result.details.change_records[0].changed_by).toBe(
      'user_sales_001'
    );

    // ステップ 6: 複数フィールド変更時の検知テスト（追加検証）
    const sales_activity_multi_change_after = {
      ...sales_activity_before,
      amount: 1500000,
      status: '完了',
      updated_at: '2024-01-15T12:00:00Z',
    };

    const multi_change_detected = detectSalesDataChange(
      sales_activity_before,
      sales_activity_multi_change_after
    );

    expect(multi_change_detected).toEqual({
      is_changed: true,
      changes: [
        {
          field_name: 'amount',
          before_value: 1000000,
          after_value: 1500000,
          timestamp: '2024-01-15T12:00:00Z',
          changed_by: 'user_sales_001',
        },
        {
          field_name: 'status',
          before_value: '進捗中',
          after_value: '完了',
          timestamp: '2024-01-15T12:00:00Z',
          changed_by: 'user_sales_001',
        },
      ],
    });

    expect(multi_change_detected.changes).toHaveLength(2);

    // ステップ 7: 変更がない場合の検知テスト
    const no_change_detected = detectSalesDataChange(
      sales_activity_before,
      sales_activity_before
    );

    expect(no_change_detected).toEqual({
      is_changed: false,
      changes: [],
    });
  });
});
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectSalesActivityDataQualityIssues } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業活動データ品質自動検出・通知機能', () => {
  // SCEN-732: [error] 営業活動データの顧客名欠落検出と修正通知発行
  test('顧客名欠落を検出してエラーログ記録・営業担当者に修正通知を発行', () => {
    // 入力データ: 顧客名が空の営業活動レコード
    const salesActivityInput = {
      sales_activity_id: 'ACT-20240115-001',
      sales_staff_id: 'STAFF-A001',
      customer_name: '', // 顧客名欠落
      contact_date: '2024-01-15',
      deal_content: 'アポイント確認',
      appointment_status: 'confirmed',
      created_at: '2024-01-15T10:00:00Z',
    };

    // 実行
    const result = detectSalesActivityDataQualityIssues(salesActivityInput);

    // 期待結果: 検出されたエラー
    expect(result.has_error).toBe(true);
    expect(result.error_list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: 'missing_required_field',
          field_name: 'customer_name',
          activity_id: 'ACT-20240115-001',
        }),
      ])
    );

    // 期待結果: エラーログに顧客名欠落が記録
    expect(result.error_log_entry).toBeDefined();
    expect(result.error_log_entry.error_message).toMatch(/顧客名/);
    expect(result.error_log_entry.target_activity_id).toBe('ACT-20240115-001');
    expect(result.error_log_entry.timestamp).toBe('2024-01-15T10:00:00Z');

    // 期待結果: 営業担当者への通知レコード生成
    expect(result.notification_record).toBeDefined();
    expect(result.notification_record.staff_id).toBe('STAFF-A001');
    expect(result.notification_record.notification_type).toBe('data_correction_required');
    expect(result.notification_record.notification_content).toMatch(/顧客名が欠落しています/);
    expect(result.notification_record.related_activity_id).toBe('ACT-20240115-001');
    expect(result.notification_record.notification_status).toBe('unprocessed');
    expect(result.notification_record.created_at).toBe('2024-01-15T10:00:00Z');

    // 期待結果: メール送信ログに営業担当者への送信記録
    expect(result.email_send_log).toBeDefined();
    expect(result.email_send_log.recipient_staff_id).toBe('STAFF-A001');
    expect(result.email_send_log.email_subject).toMatch(/営業活動データ修正が必要です/);
    expect(result.email_send_log.email_body).toMatch(/顧客名が欠落/);
    expect(result.email_send_log.email_body).toMatch(/ACT-20240115-001/);
    expect(result.email_send_log.send_status).toBe('sent');
    expect(result.email_send_log.sent_at).toBe('2024-01-15T10:00:00Z');

    // 期待結果: 検証ステータス
    expect(result.validation_status).toBe('failed');
    expect(result.can_proceed_to_next_step).toBe(false);
  });
});
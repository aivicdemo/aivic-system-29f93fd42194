import { sendContractChangeNotification } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1208
  test('メール通知自動送信・ポータル即時表示・受信確認記録 - 無効なメールアドレスへの送信試行時、送信失敗を記録し再試行キューに追加する', () => {
    const invalid_email_cases = [
      'invalid@',
      '@example',
      '',
      'notanemail',
      'user@',
    ];

    invalid_email_cases.forEach((email_address) => {
      const user_id = 'USR-' + Math.random().toString(36).substr(2, 9);
      const contract_change_data = {
        contract_id: 'CTR-' + Math.random().toString(36).substr(2, 9),
        change_content: '納期を2024-02-01から2024-03-01に変更',
        effective_date: '2024-01-20',
      };

      const result = sendContractChangeNotification({
        user_id: user_id,
        email_address: email_address,
        contract_change_data: contract_change_data,
        timestamp: new Date('2024-01-20T09:00:00Z'),
      });

      expect(result.send_status).toBe('failed');
      expect(result.error_message).toMatch(/メールアドレス/);
      expect(result.failure_log).toBeDefined();
      expect(result.failure_log.user_id).toBe(user_id);
      expect(result.failure_log.invalid_email).toBe(email_address);
      expect(result.failure_log.error_detail).toMatch(/形式/);
      expect(result.failure_log.recorded_timestamp).toBe('2024-01-20T09:00:00Z');

      expect(result.retry_queue_entry).toBeDefined();
      expect(result.retry_queue_entry.retry_queue_id).toMatch(/^RQ-/);
      expect(result.retry_queue_entry.user_id).toBe(user_id);
      expect(result.retry_queue_entry.contract_change_data).toEqual(
        contract_change_data
      );
      expect(result.retry_queue_entry.first_attempt_timestamp).toBe(
        '2024-01-20T09:00:00Z'
      );
      expect(result.retry_queue_entry.retry_count).toBe(1);
      expect(result.retry_queue_entry.next_scheduled_attempt).toMatch(
        /2024-01-20T(0[9]|1[0-9]):/
      );

      expect(result.portal_display_status).toBe('送信失敗');
      expect(result.portal_display_timestamp).toBe('2024-01-20T09:00:00Z');

      expect(result.receipt_confirmation_record).toBeDefined();
      expect(result.receipt_confirmation_record.receipt_id).toMatch(/^REC-/);
      expect(result.receipt_confirmation_record.user_id).toBe(user_id);
      expect(result.receipt_confirmation_record.email_address).toBe(
        email_address
      );
      expect(result.receipt_confirmation_record.send_status).toBe('failed');
      expect(result.receipt_confirmation_record.failure_reason).toMatch(
        /メールアドレス/
      );
      expect(result.receipt_confirmation_record.recorded_at).toBe(
        '2024-01-20T09:00:00Z'
      );
    });
  });
});
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendNotificationWithTimestamp } from '../../src/logic/it-1781935279444-2-2-1';

fetchMock.enableMocks();

describe('営業データ品質管理・請求自動化システム - メール通知自動送信', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  test('SCEN-1207: 有効なメールアドレスに通知送信ボタン押下時、メールが送信され受信確認タイムスタンプが記録される', async () => {
    // 入力条件: 有効なメールアドレス
    const input_mail_address = 'test@example.com';
    const input_notification_content = '営業データ品質チェック完了通知';
    const input_customer_id = 'CUST-001';
    const expected_send_timestamp = new Date('2024-01-15T11:00:00Z').toISOString();

    // メール送信API のモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message_id: 'MSG-20240115-001',
        send_timestamp: expected_send_timestamp,
        recipient_address: input_mail_address,
        status: 'sent',
      }),
      { status: 200 }
    );

    // ポータル通知記録API のモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notification_id: 'NOTIF-20240115-001',
        display_timestamp: expected_send_timestamp,
        portal_visibility: true,
      }),
      { status: 200 }
    );

    // データベース受信確認記録API のモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        receipt_id: 'RECEIPT-20240115-001',
        received_timestamp: expected_send_timestamp,
        confirmation_recorded: true,
      }),
      { status: 200 }
    );

    // 関数実行
    const result = await sendNotificationWithTimestamp({
      mail_address: input_mail_address,
      notification_content: input_notification_content,
      customer_id: input_customer_id,
      send_timestamp_iso: expected_send_timestamp,
    });

    // 期待結果①: メール送信成功
    expect(result.mail_send_success).toBe(true);
    expect(result.mail_recipient).toBe(input_mail_address);
    expect(result.mail_status).toBe('sent');
    expect(result.mail_message_id).toBe('MSG-20240115-001');

    // 期待結果②: ポータル通知即座表示
    expect(result.portal_notification_display).toBe(true);
    expect(result.portal_notification_id).toBe('NOTIF-20240115-001');
    expect(result.portal_display_timestamp).toBe(expected_send_timestamp);

    // 期待結果③: データベース受信確認記録
    expect(result.receipt_confirmation_recorded).toBe(true);
    expect(result.receipt_id).toBe('RECEIPT-20240115-001');
    expect(result.received_timestamp_recorded).toBe(expected_send_timestamp);

    // API呼び出し数を検証
    expect(fetchMock.mock.calls.length).toBe(3);

    // 第1回API呼び出し: メール送信
    const first_call = fetchMock.mock.calls[0];
    expect(first_call[0]).toBe('/api/notification/send-email');
    expect(first_call[1]?.method).toBe('POST');

    // 第2回API呼び出し: ポータル通知
    const second_call = fetchMock.mock.calls[1];
    expect(second_call[0]).toBe('/api/portal/record-notification');
    expect(second_call[1]?.method).toBe('POST');

    // 第3回API呼び出し: 受信確認記録
    const third_call = fetchMock.mock.calls[2];
    expect(third_call[0]).toBe('/api/database/record-receipt');
    expect(third_call[1]?.method).toBe('POST');

    // タイムスタンプの正確性を検証
    const result_timestamp = new Date(result.received_timestamp_recorded);
    const expected_timestamp_obj = new Date(expected_send_timestamp);
    expect(result_timestamp.getTime()).toBe(expected_timestamp_obj.getTime());
  });

  test('SCEN-1207: メールアドレス形式不正時、エラーが発生する', async () => {
    const input_invalid_mail = 'invalid-email-format';
    const input_notification_content = '営業データ品質チェック完了通知';
    const input_customer_id = 'CUST-001';
    const expected_send_timestamp = new Date('2024-01-15T11:00:00Z').toISOString();

    // 関数実行でエラーをスロー
    expect(() =>
      sendNotificationWithTimestamp({
        mail_address: input_invalid_mail,
        notification_content: input_notification_content,
        customer_id: input_customer_id,
        send_timestamp_iso: expected_send_timestamp,
      })
    ).toThrow(/メールアドレス/);
  });

  test('SCEN-1207: メール送信API失敗時、リトライト処理が実行される', async () => {
    const input_mail_address = 'test@example.com';
    const input_notification_content = '営業データ品質チェック完了通知';
    const input_customer_id = 'CUST-001';
    const expected_send_timestamp = new Date('2024-01-15T11:00:00Z').toISOString();

    // 1回目の送信失敗、2回目の送信成功
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: false, error: 'temporary failure' }),
      { status: 500 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message_id: 'MSG-20240115-002',
        send_timestamp: expected_send_timestamp,
        recipient_address: input_mail_address,
        status: 'sent',
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notification_id: 'NOTIF-20240115-002',
        display_timestamp: expected_send_timestamp,
        portal_visibility: true,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        receipt_id: 'RECEIPT-20240115-002',
        received_timestamp: expected_send_timestamp,
        confirmation_recorded: true,
      }),
      { status: 200 }
    );

    // 関数実行
    const result = await sendNotificationWithTimestamp({
      mail_address: input_mail_address,
      notification_content: input_notification_content,
      customer_id: input_customer_id,
      send_timestamp_iso: expected_send_timestamp,
      retry_enabled: true,
      retry_max_attempts: 2,
    });

    // リトライト後、最終的に成功
    expect(result.mail_send_success).toBe(true);
    expect(result.retry_attempt_count).toBe(2);
    expect(result.mail_message_id).toBe('MSG-20240115-002');
  });

  test('SCEN-1207: ポータル通知記録失敗時、通知記録がスキップされる', async () => {
    const input_mail_address = 'test@example.com';
    const input_notification_content = '営業データ品質チェック完了通知';
    const input_customer_id = 'CUST-001';
    const expected_send_timestamp = new Date('2024-01-15T11:00:00Z').toISOString();

    // メール送信成功
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message_id: 'MSG-20240115-003',
        send_timestamp: expected_send_timestamp,
        recipient_address: input_mail_address,
        status: 'sent',
      }),
      { status: 200 }
    );

    // ポータル通知記録失敗
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: false, error: 'portal service unavailable' }),
      { status: 503 }
    );

    // 受信確認記録はスキップ
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        skipped: true,
        reason: 'portal notification failed',
      }),
      { status: 200 }
    );

    // 関数実行
    const result = await sendNotificationWithTimestamp({
      mail_address: input_mail_address,
      notification_content: input_notification_content,
      customer_id: input_customer_id,
      send_timestamp_iso: expected_send_timestamp,
    });

    // メール送信は成功、ポータル通知は失敗
    expect(result.mail_send_success).toBe(true);
    expect(result.portal_notification_display).toBe(false);
    expect(result.receipt_confirmation_recorded).toBe(false);
  });

  test('SCEN-1207: 受信確認タイムスタンプが期待値と一致することを検証', async () => {
    const input_mail_address = 'test@example.com';
    const input_notification_content = '営業データ品質チェック完了通知';
    const input_customer_id = 'CUST-001';
    const expected_send_timestamp = new Date('2024-02-20T14:30:45.123Z').toISOString();

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message_id: 'MSG-20240220-001',
        send_timestamp: expected_send_timestamp,
        recipient_address: input_mail_address,
        status: 'sent',
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notification_id: 'NOTIF-20240220-001',
        display_timestamp: expected_send_timestamp,
        portal_visibility: true,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        receipt_id: 'RECEIPT-20240220-001',
        received_timestamp: expected_send_timestamp,
        confirmation_recorded: true,
      }),
      { status: 200 }
    );

    const result = await sendNotificationWithTimestamp({
      mail_address: input_mail_address,
      notification_content: input_notification_content,
      customer_id: input_customer_id,
      send_timestamp_iso: expected_send_timestamp,
    });

    // タイムスタンプの完全一致を検証
    expect(result.received_timestamp_recorded).toBe(expected_send_timestamp);
    expect(result.portal_display_timestamp).toBe(expected_send_timestamp);
    expect(result.mail_send_success).toBe(true);
    expect(result.portal_notification_display).toBe(true);
    expect(result.receipt_confirmation_recorded).toBe(true);
  });
});
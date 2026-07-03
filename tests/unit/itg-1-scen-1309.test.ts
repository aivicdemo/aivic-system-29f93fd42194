import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendNotificationWithFallback } from '../../src/logic/it-1-1-1';

fetchMock.enableMocks();

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1309
  test('通知システムの主要ルートが失敗した場合、エラーログが記録され代替ルートで通知が試行される', async () => {
    const alert_id = 'alert_20240215_001';
    const recipient_email = 'user@example.com';
    const recipient_phone = '+81901234567';
    const alert_title = '売上データ不整合検出';
    const alert_message = 'アポ数と成約数の矛盾が検出されました';
    const primary_route = 'message_queue';
    const fallback_route_email = 'email_service';
    const fallback_route_sms = 'sms_service';

    // Primary route: Message Queue - 意図的に失敗させるモック
    fetchMock.mockRejectOnce(new Error('Message queue connection timeout'));

    // Fallback route 1: Email Service - 成功させるモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        notification_id: 'notif_email_20240215_001',
        route: fallback_route_email,
        recipient: recipient_email,
        status: 'sent',
        sent_at: '2024-02-15T09:30:45Z',
        delivery_timestamp: '2024-02-15T09:30:46Z'
      }),
      { status: 200 }
    );

    // Fallback route 2: SMS Service - 成功させるモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        notification_id: 'notif_sms_20240215_001',
        route: fallback_route_sms,
        recipient: recipient_phone,
        status: 'sent',
        sent_at: '2024-02-15T09:30:50Z',
        delivery_timestamp: '2024-02-15T09:30:51Z'
      }),
      { status: 200 }
    );

    const input_data = {
      alert_id,
      recipient_email,
      recipient_phone,
      alert_title,
      alert_message,
      alert_severity: 'ERROR',
      event_type: 'sales_data_inconsistency',
      primary_route,
      fallback_routes: [fallback_route_email, fallback_route_sms],
      log_level: 'ERROR',
      timestamp: '2024-02-15T09:30:00Z'
    };

    const result = await sendNotificationWithFallback(input_data);

    // 期待結果 1: Primary route のエラーが記録されている
    expect(result.primary_route_status).toBe('failed');
    expect(result.primary_route_error).toMatch(/timeout|connection/i);

    // 期待結果 2: エラーログが詳細に記録されている
    expect(result.error_log).toBeDefined();
    expect(result.error_log.log_level).toBe('ERROR');
    expect(result.error_log.timestamp).toBe('2024-02-15T09:30:00Z');
    expect(result.error_log.alert_id).toBe(alert_id);
    expect(result.error_log.error_message).toMatch(/timeout|connection/i);
    expect(result.error_log.route_attempted).toBe(primary_route);

    // 期待結果 3: 代替ルートでの通知送信が実行された
    expect(result.fallback_notifications).toHaveLength(2);

    // Email 経由で成功
    expect(result.fallback_notifications[0].route).toBe(fallback_route_email);
    expect(result.fallback_notifications[0].status).toBe('sent');
    expect(result.fallback_notifications[0].notification_id).toBe('notif_email_20240215_001');
    expect(result.fallback_notifications[0].recipient).toBe(recipient_email);
    expect(result.fallback_notifications[0].sent_at).toBe('2024-02-15T09:30:45Z');

    // SMS 経由で成功
    expect(result.fallback_notifications[1].route).toBe(fallback_route_sms);
    expect(result.fallback_notifications[1].status).toBe('sent');
    expect(result.fallback_notifications[1].notification_id).toBe('notif_sms_20240215_001');
    expect(result.fallback_notifications[1].recipient).toBe(recipient_phone);
    expect(result.fallback_notifications[1].sent_at).toBe('2024-02-15T09:30:50Z');

    // 期待結果 4: 処理フロー履歴が記録されている
    expect(result.processing_flow_history).toBeDefined();
    expect(result.processing_flow_history).toHaveLength(3);

    expect(result.processing_flow_history[0].step).toBe('primary_route_attempt');
    expect(result.processing_flow_history[0].route).toBe(primary_route);
    expect(result.processing_flow_history[0].result).toBe('failed');
    expect(result.processing_flow_history[0].timestamp).toBe('2024-02-15T09:30:00Z');

    expect(result.processing_flow_history[1].step).toBe('fallback_route_attempt');
    expect(result.processing_flow_history[1].route).toBe(fallback_route_email);
    expect(result.processing_flow_history[1].result).toBe('success');
    expect(result.processing_flow_history[1].notification_id).toBe('notif_email_20240215_001');

    expect(result.processing_flow_history[2].step).toBe('fallback_route_attempt');
    expect(result.processing_flow_history[2].route).toBe(fallback_route_sms);
    expect(result.processing_flow_history[2].result).toBe('success');
    expect(result.processing_flow_history[2].notification_id).toBe('notif_sms_20240215_001');

    // 期待結果 5: 最終的な通知状態が成功
    expect(result.overall_status).toBe('success');
    expect(result.notification_delivered).toBe(true);
    expect(result.successful_routes).toEqual([fallback_route_email, fallback_route_sms]);
  });
});
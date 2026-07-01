import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendContractChangeNotification, recordDeliveryTimestamp } from '../../src/logic/it-1781935279444-2-1-1';

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('Contract Change Notification and Delivery Timestamp Recording', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1235
  test('should send contract change notification email and record delivery timestamp on notification button click', async () => {
    const contractChangeId = 'cc-20240115-001';
    const customerId = 'cust-789';
    const customerEmail = 'sales@customer-example.com';
    const changeContent = '月額単価を \$500 から \$600 に変更';
    const changeDate = '2024-01-15';
    const notificationSentAt = new Date('2024-01-15T11:00:00Z');
    const deliveryOpenedAt = new Date('2024-01-15T11:05:30Z');

    const contractChangeData = {
      contractChangeId,
      customerId,
      customerEmail,
      changeContent,
      changeDate,
      status: 'pending_notification',
    };

    // Mock: メール送信API呼び出し
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        messageId: 'msg-xyz123',
        sentAt: notificationSentAt.toISOString(),
      }),
      { status: 200 }
    );

    // メール送信処理を実行
    const sendResult = await sendContractChangeNotification(contractChangeData);

    // メール送信確認
    expect(sendResult.success).toBe(true);
    expect(sendResult.messageId).toBe('msg-xyz123');
    expect(new Date(sendResult.sentAt)).toEqual(notificationSentAt);

    // fetch呼び出しの確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sendRequest = fetchMock.mock.calls[0];
    expect(sendRequest[0]).toContain('/api/notification/send');
    const sendPayload = JSON.parse(sendRequest[1].body);
    expect(sendPayload.customerId).toBe(customerId);
    expect(sendPayload.email).toBe(customerEmail);
    expect(sendPayload.changeContent).toBe(changeContent);

    // タイムスタンプ記録処理を実行
    const deliveryTimestampData = {
      contractChangeId,
      messageId: 'msg-xyz123',
      deliveryOpenedAt: deliveryOpenedAt.toISOString(),
      recipientEmail: customerEmail,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        recordId: 'ts-record-001',
        contractChangeId,
        recordedTimestamp: deliveryOpenedAt.toISOString(),
      }),
      { status: 200 }
    );

    const recordResult = await recordDeliveryTimestamp(deliveryTimestampData);

    // タイムスタンプ記録確認
    expect(recordResult.success).toBe(true);
    expect(recordResult.recordId).toBe('ts-record-001');
    expect(recordResult.contractChangeId).toBe(contractChangeId);
    expect(new Date(recordResult.recordedTimestamp)).toEqual(deliveryOpenedAt);

    // 記録されたタイムスタンプが開封時刻と一致していることを確認
    expect(new Date(recordResult.recordedTimestamp)).toEqual(deliveryOpenedAt);

    // fetch呼び出しの確認（合計2回）
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const recordRequest = fetchMock.mock.calls[1];
    expect(recordRequest[0]).toContain('/api/delivery-timestamp/record');
    const recordPayload = JSON.parse(recordRequest[1].body);
    expect(recordPayload.contractChangeId).toBe(contractChangeId);
    expect(recordPayload.deliveryOpenedAt).toBe(deliveryOpenedAt.toISOString());
  });
});
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateMonthlyReportWithTimeout } from '../../src/logic/it-1-br-1781935279444-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('月次サマリーテンプレートの定義・管理機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SCEN-1147: [error] 月次レポート生成・配信期限管理機能 - 処理がタイムアウトした場合に管理者へ通知が送信される
  test('should send admin notification when monthly report generation times out', async () => {
    const adminEmail = 'admin@company.com';
    const reportId = 'REPORT-2024-01-001';
    const timeoutMs = 1000;
    const largeDatasetSize = 100000;
    const errorOccurredAt = new Date('2024-01-15T14:30:45Z');

    // Mock the notification endpoint
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notificationId: 'NOTIF-001',
        sentAt: '2024-01-15T14:30:50Z',
      }),
      { status: 200 }
    );

    // Execute report generation with timeout
    const result = await generateMonthlyReportWithTimeout({
      reportId,
      datasetSize: largeDatasetSize,
      timeoutMs,
      adminEmail,
      targetDate: '2024-01-15',
    });

    // Verify timeout error occurred
    expect(result).toHaveProperty('status', 'timeout');
    expect(result).toHaveProperty('errorType', 'TIMEOUT_EXCEEDED');

    // Verify notification was sent
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const notificationCall = fetchMock.mock.calls[0];
    expect(notificationCall[0]).toContain('/notify');

    const notificationPayload = JSON.parse(notificationCall[1].body);

    // Verify error notification includes all required information
    expect(notificationPayload).toHaveProperty('recipient', adminEmail);
    expect(notificationPayload).toHaveProperty('errorType', 'TIMEOUT_EXCEEDED');
    expect(notificationPayload).toHaveProperty('reportId', reportId);
    expect(notificationPayload).toHaveProperty(
      'message',
      expect.stringMatching(/タイムアウト/)
    );

    // Verify notification contains error details
    expect(notificationPayload).toHaveProperty('occurredAt');
    expect(notificationPayload).toHaveProperty('targetReport');
    expect(notificationPayload).toHaveProperty('recommendedAction');

    // Verify occurred time is recorded
    const occurredTime = new Date(notificationPayload.occurredAt);
    expect(occurredTime).toBeInstanceOf(Date);
    expect(occurredTime.getTime()).toBeGreaterThan(
      errorOccurredAt.getTime() - 5000
    );

    // Verify target report information
    expect(notificationPayload.targetReport).toEqual(
      expect.objectContaining({
        reportId,
        datasetSize: largeDatasetSize,
        targetDate: '2024-01-15',
      })
    );

    // Verify recommended action is provided
    expect(notificationPayload.recommendedAction).toMatch(
      /タイムアウト時間を延長|データセットを分割|管理者に連絡/
    );

    // Verify the result includes notification status
    expect(result).toHaveProperty('notificationSent', true);
    expect(result).toHaveProperty('notificationId', 'NOTIF-001');
  });
});
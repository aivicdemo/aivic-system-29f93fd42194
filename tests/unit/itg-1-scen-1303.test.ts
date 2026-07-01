import { executeAccountingSystemApiRetry } from '../../src/logic/it-1-2-1';

describe('営業データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1303
  test('会計システムAPI連携実行機能 - 自動再試行の最大試行回数に達した場合に、最終的なアラート通知が実行される', async () => {
    const maxRetries = 3;
    const integrationConfig = {
      systemName: '会計システム',
      endpoint: 'https://accounting.example.com/api/billing',
      maxRetries: maxRetries,
      retryIntervalMs: 100,
      timeoutMs: 5000,
    };

    const billingData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      billingAmount: 150000,
      billingDate: '2024-01-15',
      invoiceNumber: 'INV-2024-001',
    };

    let requestCount = 0;
    const apiResponses: Array<{ attempt: number; timestamp: string; status: number }> = [];
    const alertNotifications: Array<{
      errorContent: string;
      retryCount: number;
      failureTime: string;
      systemInfo: string;
    }> = [];
    const logMessages: string[] = [];

    const mockFetch = jest.fn(async () => {
      requestCount++;
      const attemptTime = new Date('2024-01-15T10:00:00Z').toISOString();
      apiResponses.push({
        attempt: requestCount,
        timestamp: attemptTime,
        status: 500,
      });
      const error = new Error('会計システムが一時的に利用できません');
      throw error;
    });

    const mockAlertNotification = jest.fn((payload: {
      errorContent: string;
      retryCount: number;
      failureTime: string;
      systemInfo: string;
    }) => {
      alertNotifications.push(payload);
    });

    const mockLogger = jest.fn((message: string) => {
      logMessages.push(message);
    });

    const result = await executeAccountingSystemApiRetry(
      billingData,
      integrationConfig,
      mockFetch,
      mockAlertNotification,
      mockLogger
    );

    expect(requestCount).toBe(4);
    expect(apiResponses).toHaveLength(4);
    expect(apiResponses[0].attempt).toBe(1);
    expect(apiResponses[1].attempt).toBe(2);
    expect(apiResponses[2].attempt).toBe(3);
    expect(apiResponses[3].attempt).toBe(4);
    expect(apiResponses[0].status).toBe(500);
    expect(apiResponses[1].status).toBe(500);
    expect(apiResponses[2].status).toBe(500);
    expect(apiResponses[3].status).toBe(500);

    expect(mockAlertNotification).toHaveBeenCalledTimes(1);
    expect(alertNotifications).toHaveLength(1);

    const alertPayload = alertNotifications[0];
    expect(alertPayload.errorContent).toMatch(/会計システム/);
    expect(alertPayload.retryCount).toBe(maxRetries);
    expect(alertPayload.failureTime).toBe('2024-01-15T10:00:00Z');
    expect(alertPayload.systemInfo).toMatch(/会計システム/);

    expect(mockLogger).toHaveBeenCalled();
    const logContainsMaxRetry = logMessages.some((msg) => msg.includes('最大再試行回数に達した'));
    expect(logContainsMaxRetry).toBe(true);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/最大再試行回数/);
    expect(result.finalAttemptCount).toBe(4);
    expect(result.alertSent).toBe(true);
  });
});
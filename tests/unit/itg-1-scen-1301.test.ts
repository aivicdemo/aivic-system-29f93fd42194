import { executeAccountingSystemAPIWithRetry } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1301: [error] 会計システムAPI連携実行機能 - API連携がネットワークエラーで失敗した場合に、自動再試行が実行される
  test('ネットワークエラー発生時に自動再試行メカニズムが正常に機能し、設定回数内での再試行が実行される', async () => {
    fetchMock.resetMocks();

    const requestPayload = {
      customerId: 'CUST-001',
      invoiceAmount: 150000,
      invoicePeriod: '2024-01',
      serviceType: 'SALES_COMMISSION',
    };

    const maxRetries = 3;
    const retryIntervalMs = 100;
    let attemptCount = 0;

    // 最初の2回はネットワークエラー、3回目で成功
    fetchMock.mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        const error = new Error('Network error');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      }
      // 3回目で成功
      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: 'INV-2024-001',
          amount: 150000,
          status: 'POSTED',
          timestamp: '2024-01-15T11:30:00Z',
        }),
        { status: 200 }
      );
    });

    const result = await executeAccountingSystemAPIWithRetry(
      requestPayload,
      maxRetries,
      retryIntervalMs
    );

    // 再試行回数が設定値以内であることを確認
    expect(attemptCount).toBeLessThanOrEqual(maxRetries);
    expect(attemptCount).toBe(3);

    // 最終的なAPI呼び出し結果が成功であることを確認
    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('INV-2024-001');
    expect(result.amount).toBe(150000);
    expect(result.status).toBe('POSTED');

    // 各再試行の間隔が正しく設定されていることを検証（実装側で時間管理）
    expect(result.retryCount).toBe(2);
    expect(result.totalRetryTimeMs).toBeGreaterThanOrEqual(retryIntervalMs * 2);
    expect(result.totalRetryTimeMs).toBeLessThan(retryIntervalMs * 3 + 100);
  });

  test('最大再試行回数に達してもAPIが失敗した場合、適切なエラーハンドリングが行われる', async () => {
    fetchMock.resetMocks();

    const requestPayload = {
      customerId: 'CUST-002',
      invoiceAmount: 200000,
      invoicePeriod: '2024-01',
      serviceType: 'SALES_COMMISSION',
    };

    const maxRetries = 3;
    const retryIntervalMs = 50;
    let attemptCount = 0;

    // すべてのリクエストがネットワークエラーで失敗
    fetchMock.mockImplementation(async () => {
      attemptCount++;
      const error = new Error('Network timeout');
      (error as any).code = 'ETIMEDOUT';
      throw error;
    });

    // エラーが正しくスローされることを確認
    await expect(
      executeAccountingSystemAPIWithRetry(
        requestPayload,
        maxRetries,
        retryIntervalMs
      )
    ).rejects.toThrow(/ネットワークエラー|再試行|接続/);

    // 最大再試行回数まで試行されたことを確認
    expect(attemptCount).toBe(maxRetries + 1);
  });

  test('再試行の間隔が正確に管理され、指定された時間経過後に再試行が実行される', async () => {
    fetchMock.resetMocks();

    const requestPayload = {
      customerId: 'CUST-003',
      invoiceAmount: 250000,
      invoicePeriod: '2024-01',
      serviceType: 'SALES_COMMISSION',
    };

    const maxRetries = 2;
    const retryIntervalMs = 150;
    const attemptTimestamps: number[] = [];

    fetchMock.mockImplementation(async () => {
      attemptTimestamps.push(Date.now());
      if (attemptTimestamps.length < 3) {
        const error = new Error('Temporary connection error');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      }
      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: 'INV-2024-002',
          amount: 250000,
          status: 'POSTED',
          timestamp: '2024-01-15T12:00:00Z',
        }),
        { status: 200 }
      );
    });

    const result = await executeAccountingSystemAPIWithRetry(
      requestPayload,
      maxRetries,
      retryIntervalMs
    );

    // 成功の確認
    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('INV-2024-002');

    // 再試行間隔の検証
    if (attemptTimestamps.length >= 2) {
      const firstInterval = attemptTimestamps[1] - attemptTimestamps[0];
      expect(firstInterval).toBeGreaterThanOrEqual(retryIntervalMs * 0.8);
      expect(firstInterval).toBeLessThan(retryIntervalMs * 1.5);
    }

    if (attemptTimestamps.length >= 3) {
      const secondInterval = attemptTimestamps[2] - attemptTimestamps[1];
      expect(secondInterval).toBeGreaterThanOrEqual(retryIntervalMs * 0.8);
      expect(secondInterval).toBeLessThan(retryIntervalMs * 1.5);
    }
  });

  test('ネットワークエラーではなく、正常系のレスポンスが最初に返された場合、再試行なしで成功が返される', async () => {
    fetchMock.resetMocks();

    const requestPayload = {
      customerId: 'CUST-004',
      invoiceAmount: 300000,
      invoicePeriod: '2024-01',
      serviceType: 'SALES_COMMISSION',
    };

    const maxRetries = 3;
    const retryIntervalMs = 100;
    let attemptCount = 0;

    // 最初のリクエストで成功
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        invoiceId: 'INV-2024-003',
        amount: 300000,
        status: 'POSTED',
        timestamp: '2024-01-15T13:00:00Z',
      }),
      { status: 200 }
    );

    fetchMock.mockImplementation(async () => {
      attemptCount++;
      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: 'INV-2024-003',
          amount: 300000,
          status: 'POSTED',
          timestamp: '2024-01-15T13:00:00Z',
        }),
        { status: 200 }
      );
    });

    const result = await executeAccountingSystemAPIWithRetry(
      requestPayload,
      maxRetries,
      retryIntervalMs
    );

    // 成功の確認
    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('INV-2024-003');
    expect(result.amount).toBe(300000);
    expect(result.status).toBe('POSTED');

    // 再試行回数が0であることを確認（最初のリクエストで成功）
    expect(result.retryCount).toBe(0);
  });

  test('API呼び出しが5XX エラーで返された場合、再試行が実行される', async () => {
    fetchMock.resetMocks();

    const requestPayload = {
      customerId: 'CUST-005',
      invoiceAmount: 175000,
      invoicePeriod: '2024-02',
      serviceType: 'SALES_COMMISSION',
    };

    const maxRetries = 2;
    const retryIntervalMs = 100;
    let attemptCount = 0;

    fetchMock.mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 2) {
        // 最初は500エラー
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Internal Server Error',
          }),
          { status: 500 }
        );
      }
      // 2回目で成功
      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: 'INV-2024-004',
          amount: 175000,
          status: 'POSTED',
          timestamp: '2024-02-15T10:00:00Z',
        }),
        { status: 200 }
      );
    });

    const result = await executeAccountingSystemAPIWithRetry(
      requestPayload,
      maxRetries,
      retryIntervalMs
    );

    // 再試行後の成功を確認
    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe('INV-2024-004');
    expect(result.amount).toBe(175000);

    // 再試行が実行されたことを確認
    expect(attemptCount).toBeGreaterThan(1);
    expect(attemptCount).toBeLessThanOrEqual(maxRetries + 1);
  });
});
import { executeAccountingSystemApiWithRetry } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1275: API連携失敗時に自動再試行が実行される', async () => {
    fetchMock.resetMocks();

    const billingData = {
      customer_id: 'CUST-001',
      service_id: 'SVC-A',
      billing_amount: 50000,
      billing_date: '2024-01-15',
      transaction_id: 'TRX-20240115-001',
    };

    const maxRetries = 3;
    const retryIntervalMs = 100;

    // 最初の2回は失敗（ネットワークエラーをシミュレート）
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Network timeout' }),
      { status: 500 }
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Temporary service unavailable' }),
      { status: 503 }
    );
    // 3回目は成功
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        data: {
          transaction_id: billingData.transaction_id,
          status: 'synced',
          synced_at: '2024-01-15T12:34:56Z',
        },
      }),
      { status: 200 }
    );

    const result = await executeAccountingSystemApiWithRetry(
      billingData,
      maxRetries,
      retryIntervalMs
    );

    // 最終的に成功したことを確認
    expect(result.success).toBe(true);
    expect(result.data.transaction_id).toBe('TRX-20240115-001');
    expect(result.data.status).toBe('synced');
    expect(result.data.synced_at).toBe('2024-01-15T12:34:56Z');

    // 再試行ログが記録されていることを確認
    expect(result.retry_attempts).toBe(2);
    expect(result.retry_log).toBeDefined();
    expect(result.retry_log.length).toBe(2);

    // 1回目の再試行ログ検証
    expect(result.retry_log[0].attempt_number).toBe(1);
    expect(result.retry_log[0].status_code).toBe(500);
    expect(result.retry_log[0].error_message).toBe('Network timeout');

    // 2回目の再試行ログ検証
    expect(result.retry_log[1].attempt_number).toBe(2);
    expect(result.retry_log[1].status_code).toBe(503);
    expect(result.retry_log[1].error_message).toBe('Temporary service unavailable');

    // API呼び出しが3回行われたことを確認
    expect(fetchMock.mock.calls.length).toBe(3);

    // 送信されたデータの検証
    for (let i = 0; i < 3; i++) {
      const [url, options] = fetchMock.mock.calls[i];
      expect(url).toBe('https://accounting-system.api/sync-billing');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(billingData);
    }

    // 最終ステータスが成功であることを確認
    expect(result.final_status).toBe('success');
  });
});
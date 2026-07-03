import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { executeAccountingSystemApiWithRetry } from '../../src/logic/it-1-2-1';

fetchMock.enableMocks();

describe('会計システムAPI連携機能 - リトライ上限', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1278
  test('API呼び出しがリトライ上限に達した場合、エラーとして記録される', async () => {
    const billing_data_id = 'BILL-20240115-001';
    const customer_id = 'CUST-ABC123';
    const accounting_api_url = 'https://accounting-api.example.com/v1/invoices';
    const max_retry_count = 3;
    const request_timestamp = new Date('2024-01-15T11:00:00Z');

    const billing_payload = {
      billing_data_id,
      customer_id,
      service_id: 'SVC-001',
      billing_amount: 150000,
      billing_date: '2024-01-15',
      currency: 'JPY',
    };

    fetchMock.mockReject(new Error('Network timeout'));

    const result = await executeAccountingSystemApiWithRetry({
      billing_data_id,
      billing_payload,
      accounting_api_url,
      max_retry_count,
      request_timestamp,
    });

    expect(result.status).toBe('error');
    expect(result.retry_attempt_count).toBe(3);
    expect(result.error_code).toBe('ACCT_API_MAX_RETRY_EXCEEDED');
    expect(result.error_message).toMatch(/リトライ上限/);
    expect(result.error_occurred_at).toBeDefined();
    expect(new Date(result.error_occurred_at).getTime()).toBeGreaterThanOrEqual(
      request_timestamp.getTime()
    );
    expect(result.billing_data_status).toBe('error');
    expect(result.error_details).toHaveProperty('final_error_reason');
    expect(result.error_details.final_error_reason).toMatch(/Network timeout/);
  });
});
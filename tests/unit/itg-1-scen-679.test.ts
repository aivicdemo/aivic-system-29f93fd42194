import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndDistributeReports } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-679: [normal] レポート自動配信機能 - 配信対象顧客が複数の場合、全顧客に同時配信される
  test('複数の配信対象顧客に対して同時刻でレポートが配信され、各顧客が正確な内容を受け取ることを検証', () => {
    const execution_timestamp = '2024-01-15T09:00:00Z';
    const customer_1_id = 'CUST001';
    const customer_2_id = 'CUST002';
    const customer_3_id = 'CUST003';
    const report_id = 'REPORT202401001';
    const service_1 = 'SERVICE_A';
    const service_2 = 'SERVICE_B';

    const distribution_request = {
      report_id: report_id,
      execution_timestamp: execution_timestamp,
      customers: [
        {
          customer_id: customer_1_id,
          service_types: [service_1, service_2],
          email: 'contact@customer1.jp',
          report_content: {
            apo_count: 15,
            contract_count: 3,
            service_A_billing_amount: 450000,
            service_B_billing_amount: 300000,
            total_billing_amount: 750000,
          },
        },
        {
          customer_id: customer_2_id,
          service_types: [service_1],
          email: 'contact@customer2.jp',
          report_content: {
            apo_count: 8,
            contract_count: 2,
            service_A_billing_amount: 240000,
            service_B_billing_amount: 0,
            total_billing_amount: 240000,
          },
        },
        {
          customer_id: customer_3_id,
          service_types: [service_2],
          email: 'contact@customer3.jp',
          report_content: {
            apo_count: 12,
            contract_count: 4,
            service_A_billing_amount: 0,
            service_B_billing_amount: 480000,
            total_billing_amount: 480000,
          },
        },
      ],
    };

    const expected_distribution_log = [
      {
        log_id: 'LOG20240115090000001',
        report_id: report_id,
        customer_id: customer_1_id,
        distribution_timestamp: execution_timestamp,
        status: 'SUCCESS',
        email_address: 'contact@customer1.jp',
        content_hash: expect.any(String),
      },
      {
        log_id: 'LOG20240115090000002',
        report_id: report_id,
        customer_id: customer_2_id,
        distribution_timestamp: execution_timestamp,
        status: 'SUCCESS',
        email_address: 'contact@customer2.jp',
        content_hash: expect.any(String),
      },
      {
        log_id: 'LOG20240115090000003',
        report_id: report_id,
        customer_id: customer_3_id,
        distribution_timestamp: execution_timestamp,
        status: 'SUCCESS',
        email_address: 'contact@customer3.jp',
        content_hash: expect.any(String),
      },
    ];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        distribution_logs: expected_distribution_log,
        total_customers_distributed: 3,
        total_customers_failed: 0,
        execution_timestamp: execution_timestamp,
      }),
      { status: 200 }
    );

    const result = generateAndDistributeReports(distribution_request);

    expect(result).toEqual({
      distribution_logs: expect.any(Array),
      total_customers_distributed: 3,
      total_customers_failed: 0,
      execution_timestamp: execution_timestamp,
    });

    expect(result.distribution_logs).toHaveLength(3);

    const log_1 = result.distribution_logs[0];
    const log_2 = result.distribution_logs[1];
    const log_3 = result.distribution_logs[2];

    expect(log_1.customer_id).toBe(customer_1_id);
    expect(log_1.distribution_timestamp).toBe(execution_timestamp);
    expect(log_1.status).toBe('SUCCESS');
    expect(log_1.email_address).toBe('contact@customer1.jp');

    expect(log_2.customer_id).toBe(customer_2_id);
    expect(log_2.distribution_timestamp).toBe(execution_timestamp);
    expect(log_2.status).toBe('SUCCESS');
    expect(log_2.email_address).toBe('contact@customer2.jp');

    expect(log_3.customer_id).toBe(customer_3_id);
    expect(log_3.distribution_timestamp).toBe(execution_timestamp);
    expect(log_3.status).toBe('SUCCESS');
    expect(log_3.email_address).toBe('contact@customer3.jp');

    expect(log_1.distribution_timestamp).toBe(log_2.distribution_timestamp);
    expect(log_2.distribution_timestamp).toBe(log_3.distribution_timestamp);

    expect(result.total_customers_distributed).toBe(3);
    expect(result.total_customers_failed).toBe(0);

    expect(result.distribution_logs.every((log: any) => log.status === 'SUCCESS')).toBe(true);
  });
});
import { describe, test, expect } from '@jest/globals';
import { extractContractAndBillingTimeseries } from '../../src/logic/it-1781935279444-2-2-1';

const fetchMock = require('jest-fetch-mock');

describe('契約履歴と請求データの時系列抽出機能', () => {
  test('SCEN-865: 存在しない顧客IDで検索した場合に空のデータセットが返される', async () => {
    fetchMock.resetMocks();

    const nonexistentCustomerId = 'CUST-99999999';
    const targetPeriodStartDate = '2024-01-01';
    const targetPeriodEndDate = '2024-12-31';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        statusCode: 200,
        data: [],
        message: null,
      }),
      { status: 200 }
    );

    const result = await extractContractAndBillingTimeseries({
      customerId: nonexistentCustomerId,
      periodStartDate: targetPeriodStartDate,
      periodEndDate: targetPeriodEndDate,
    });

    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);
    expect(result.message).toBeNull();
  });

  test('SCEN-865: 存在しない顧客IDで検索時に404ステータスコードが返される場合', async () => {
    fetchMock.resetMocks();

    const nonexistentCustomerId = 'CUST-99999999';
    const targetPeriodStartDate = '2024-01-01';
    const targetPeriodEndDate = '2024-12-31';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        statusCode: 404,
        data: null,
        message: '指定された顧客IDが見つかりません',
      }),
      { status: 404 }
    );

    const result = await extractContractAndBillingTimeseries({
      customerId: nonexistentCustomerId,
      periodStartDate: targetPeriodStartDate,
      periodEndDate: targetPeriodEndDate,
    });

    expect(result.statusCode).toBe(404);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/顧客ID/);
  });

  test('SCEN-865: 有効な顧客IDで検索した場合に契約と請求データが時系列で返される', async () => {
    fetchMock.resetMocks();

    const validCustomerId = 'CUST-2024-001';
    const targetPeriodStartDate = '2024-01-01';
    const targetPeriodEndDate = '2024-12-31';

    const expectedTimseriesData = [
      {
        eventType: 'contract_created',
        eventDate: '2024-01-15',
        contractId: 'CTR-2024-001',
        amount: 100000,
      },
      {
        eventType: 'billing_issued',
        eventDate: '2024-02-01',
        billingId: 'BIL-2024-001',
        amount: 50000,
      },
      {
        eventType: 'contract_modified',
        eventDate: '2024-06-10',
        contractId: 'CTR-2024-001',
        amount: 120000,
      },
    ];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        statusCode: 200,
        data: expectedTimseriesData,
        message: null,
      }),
      { status: 200 }
    );

    const result = await extractContractAndBillingTimeseries({
      customerId: validCustomerId,
      periodStartDate: targetPeriodStartDate,
      periodEndDate: targetPeriodEndDate,
    });

    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(3);
    expect(result.data[0].eventType).toBe('contract_created');
    expect(result.data[0].eventDate).toBe('2024-01-15');
    expect(result.data[0].contractId).toBe('CTR-2024-001');
    expect(result.data[0].amount).toBe(100000);
    expect(result.data[1].eventType).toBe('billing_issued');
    expect(result.data[1].eventDate).toBe('2024-02-01');
    expect(result.data[1].billingId).toBe('BIL-2024-001');
    expect(result.data[1].amount).toBe(50000);
    expect(result.data[2].eventType).toBe('contract_modified');
    expect(result.data[2].eventDate).toBe('2024-06-10');
    expect(result.data[2].contractId).toBe('CTR-2024-001');
    expect(result.data[2].amount).toBe(120000);
    expect(result.message).toBeNull();
  });

  test('SCEN-865: 期間指定で抽出されたデータが時系列でソートされている', async () => {
    fetchMock.resetMocks();

    const validCustomerId = 'CUST-2024-002';
    const targetPeriodStartDate = '2024-04-01';
    const targetPeriodEndDate = '2024-08-31';

    const expectedTimseriesData = [
      {
        eventType: 'billing_issued',
        eventDate: '2024-04-15',
        billingId: 'BIL-2024-002',
        amount: 75000,
      },
      {
        eventType: 'contract_modified',
        eventDate: '2024-06-20',
        contractId: 'CTR-2024-002',
        amount: 110000,
      },
      {
        eventType: 'billing_issued',
        eventDate: '2024-08-01',
        billingId: 'BIL-2024-003',
        amount: 55000,
      },
    ];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        statusCode: 200,
        data: expectedTimseriesData,
        message: null,
      }),
      { status: 200 }
    );

    const result = await extractContractAndBillingTimeseries({
      customerId: validCustomerId,
      periodStartDate: targetPeriodStartDate,
      periodEndDate: targetPeriodEndDate,
    });

    expect(result.statusCode).toBe(200);
    expect(result.data.length).toBe(3);
    expect(result.data[0].eventDate).toBe('2024-04-15');
    expect(result.data[1].eventDate).toBe('2024-06-20');
    expect(result.data[2].eventDate).toBe('2024-08-01');
    const dates = result.data.map((item) => new Date(item.eventDate).getTime());
    expect(dates[0] < dates[1] && dates[1] < dates[2]).toBe(true);
  });

  test('SCEN-865: APIエラー時に例外を発生させずにエラーレスポンスを返す', async () => {
    fetchMock.resetMocks();

    const validCustomerId = 'CUST-2024-003';
    const targetPeriodStartDate = '2024-01-01';
    const targetPeriodEndDate = '2024-12-31';

    fetchMock.mockRejectOnce(new Error('Network error'));

    try {
      await extractContractAndBillingTimeseries({
        customerId: validCustomerId,
        periodStartDate: targetPeriodStartDate,
        periodEndDate: targetPeriodEndDate,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/Network/);
    }
  });

  test('SCEN-865: 顧客IDが存在するが対象期間にデータがない場合は空配列を返す', async () => {
    fetchMock.resetMocks();

    const validCustomerId = 'CUST-2024-004';
    const targetPeriodStartDate = '2025-01-01';
    const targetPeriodEndDate = '2025-12-31';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        statusCode: 200,
        data: [],
        message: null,
      }),
      { status: 200 }
    );

    const result = await extractContractAndBillingTimeseries({
      customerId: validCustomerId,
      periodStartDate: targetPeriodStartDate,
      periodEndDate: targetPeriodEndDate,
    });

    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);
    expect(result.message).toBeNull();
  });
});
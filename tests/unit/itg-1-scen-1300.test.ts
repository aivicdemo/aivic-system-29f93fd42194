import { executeAccountingSystemAPIIntegration } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('会計システムAPI連携実行機能', () => {
  test('SCEN-1300: 検証済み請求情報が会計システムへのAPI連携に成功し、連携ログが記録される', async () => {
    fetchMock.resetMocks();

    const validatedBillingInfo = {
      billingId: 'BILL-2024-001',
      customerId: 'CUST-A001',
      serviceId: 'SVC-001',
      billingAmount: 150000,
      billingDate: '2024-01-31',
      validationStatus: '承認済み',
      targetMonth: '2024-01',
    };

    const accountingSystemResponse = {
      accountingId: 'ACC-2024-001',
      status: 'success',
      message: '請求情報を正常に受領しました',
      processedAt: '2024-01-31T15:30:45Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(accountingSystemResponse), {
      status: 200,
    });

    const result = await executeAccountingSystemAPIIntegration(
      validatedBillingInfo
    );

    expect(fetchMock.mock.calls.length).toBe(1);

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toMatch(/accounting-system|api\/billing/i);
    expect(callArgs[1].method).toBe('POST');

    const requestBody = JSON.parse(callArgs[1].body);
    expect(requestBody.billingId).toBe('BILL-2024-001');
    expect(requestBody.customerId).toBe('CUST-A001');
    expect(requestBody.billingAmount).toBe(150000);

    expect(result.integrationStatus).toBe('成功');

    expect(result.integrationLog).toBeDefined();
    expect(result.integrationLog.billingId).toBe('BILL-2024-001');
    expect(result.integrationLog.accountingSystemId).toBe('ACC-2024-001');
    expect(result.integrationLog.status).toBe('成功');

    expect(result.integrationLog.timestamp).toBeDefined();
    const logTimestamp = new Date(result.integrationLog.timestamp);
    expect(logTimestamp.getFullYear()).toBe(2024);
    expect(logTimestamp.getMonth()).toBe(0);
    expect(logTimestamp.getDate()).toBe(31);

    expect(result.integrationLog.responseInfo).toBeDefined();
    expect(result.integrationLog.responseInfo.accountingId).toBe(
      'ACC-2024-001'
    );
    expect(result.integrationLog.responseInfo.message).toBe(
      '請求情報を正常に受領しました'
    );
    expect(result.integrationLog.responseInfo.processedAt).toBe(
      '2024-01-31T15:30:45Z'
    );
  });
});
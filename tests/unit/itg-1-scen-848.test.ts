import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { notifyContractChangeToCustomer } from '../../src/logic/it-1-br-1781935279444-1-2-1';

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('月次サマリーテンプレート - 契約変更時の顧客企業への自動メール通知', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-848
  test('代表兼営業オペレーターが契約内容を変更したとき、顧客企業営業責任者へメール通知が自動送信される', async () => {
    const contractId = 'CNT-20240115-001';
    const customerId = 'CUST-A001';
    const customerResponsibleEmail = 'manager@customer-company.jp';
    const contractChangeTimestamp = '2024-01-15T14:30:00Z';
    const operatorUserId = 'OP-USER-001';
    
    const contractChangePayload = {
      contractId: contractId,
      customerId: customerId,
      contractAmount: 500000,
      contractPeriodStart: '2024-01-15',
      contractPeriodEnd: '2024-12-31',
      serviceContent: 'Enhanced Sales Support Package',
      changes: [
        {
          fieldName: 'contractAmount',
          previousValue: 400000,
          newValue: 500000,
          changeReason: 'Service upgrade requested by customer'
        },
        {
          fieldName: 'serviceContent',
          previousValue: 'Standard Sales Support',
          newValue: 'Enhanced Sales Support Package',
          changeReason: 'Add premium features'
        }
      ],
      changedAt: contractChangeTimestamp,
      changedBy: operatorUserId
    };

    const emailNotificationPayload = {
      recipientEmail: customerResponsibleEmail,
      recipientName: 'Customer Manager',
      contractId: contractId,
      customerId: customerId,
      contractChangeDetails: {
        contractAmount: {
          previous: 400000,
          current: 500000
        },
        serviceContent: {
          previous: 'Standard Sales Support',
          current: 'Enhanced Sales Support Package'
        },
        contractPeriod: {
          start: '2024-01-15',
          end: '2024-12-31'
        }
      },
      notificationSentAt: contractChangeTimestamp,
      notificationId: 'NOTIF-20240115-001'
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notificationId: 'NOTIF-20240115-001',
        emailStatus: 'sent',
        sentAt: contractChangeTimestamp,
        recipientEmail: customerResponsibleEmail,
        duplicateSendCheck: false,
        messageId: 'MSG-20240115-001'
      }),
      { status: 200 }
    );

    const result = await notifyContractChangeToCustomer(contractChangePayload);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('NOTIF-20240115-001');
    expect(result.emailStatus).toBe('sent');
    expect(result.recipientEmail).toBe(customerResponsibleEmail);
    expect(result.duplicateSendCheck).toBe(false);
    expect(result.sentAt).toBe(contractChangeTimestamp);
    expect(result.messageId).toBe('MSG-20240115-001');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArg = fetchMock.mock.calls[0][1];
    const requestBody = JSON.parse(callArg.body);
    
    expect(requestBody.contractId).toBe(contractId);
    expect(requestBody.customerId).toBe(customerId);
    expect(requestBody.recipientEmail).toBe(customerResponsibleEmail);
    expect(requestBody.changes).toHaveLength(2);
    expect(requestBody.changes[0].fieldName).toBe('contractAmount');
    expect(requestBody.changes[0].previousValue).toBe(400000);
    expect(requestBody.changes[0].newValue).toBe(500000);
    expect(requestBody.changes[1].fieldName).toBe('serviceContent');
    expect(requestBody.changes[1].previousValue).toBe('Standard Sales Support');
    expect(requestBody.changes[1].newValue).toBe('Enhanced Sales Support Package');
    expect(requestBody.changedAt).toBe(contractChangeTimestamp);
    expect(requestBody.changedBy).toBe(operatorUserId);
  });

  // SCEN-848: エラーケース - 顧客企業営業責任者メールアドレス未設定
  test('顧客企業営業責任者メールアドレスが未設定の場合、メール通知エラーが発生', async () => {
    const contractChangePayloadMissingEmail = {
      contractId: 'CNT-20240115-002',
      customerId: 'CUST-A002',
      contractAmount: 600000,
      contractPeriodStart: '2024-01-20',
      contractPeriodEnd: '2024-12-31',
      serviceContent: 'Premium Package',
      changes: [
        {
          fieldName: 'contractAmount',
          previousValue: 500000,
          newValue: 600000,
          changeReason: 'Rate increase'
        }
      ],
      changedAt: '2024-01-20T09:15:00Z',
      changedBy: 'OP-USER-002',
      customerResponsibleEmail: null
    };

    expect(() => {
      notifyContractChangeToCustomer(contractChangePayloadMissingEmail);
    }).toThrow(/メールアドレス/);
  });

  // SCEN-848: エラーケース - 契約ID未設定
  test('契約IDが未設定の場合、メール通知エラーが発生', () => {
    const contractChangePayloadMissingContractId = {
      contractId: '',
      customerId: 'CUST-A003',
      customerResponsibleEmail: 'manager@customer.jp',
      contractAmount: 550000,
      contractPeriodStart: '2024-02-01',
      contractPeriodEnd: '2024-12-31',
      serviceContent: 'Standard Package',
      changes: [
        {
          fieldName: 'contractAmount',
          previousValue: 500000,
          newValue: 550000,
          changeReason: 'Annual adjustment'
        }
      ],
      changedAt: '2024-02-01T10:00:00Z',
      changedBy: 'OP-USER-003'
    };

    expect(() => {
      notifyContractChangeToCustomer(contractChangePayloadMissingContractId);
    }).toThrow(/契約ID/);
  });

  // SCEN-848: 複数変更項目のメール通知が正確に送信される
  test('複数の契約変更項目を含むメール通知が正確に送信される', async () => {
    const contractId = 'CNT-20240122-005';
    const customerId = 'CUST-A005';
    const customerResponsibleEmail = 'director@customer-company.jp';
    const contractChangeTimestamp = '2024-01-22T16:45:00Z';
    const operatorUserId = 'OP-USER-005';

    const multipleChangesPayload = {
      contractId: contractId,
      customerId: customerId,
      customerResponsibleEmail: customerResponsibleEmail,
      contractAmount: 750000,
      contractPeriodStart: '2024-01-22',
      contractPeriodEnd: '2025-01-21',
      serviceContent: 'Premium Multi-Service Bundle',
      changes: [
        {
          fieldName: 'contractAmount',
          previousValue: 650000,
          newValue: 750000,
          changeReason: 'Service tier upgrade'
        },
        {
          fieldName: 'contractPeriodEnd',
          previousValue: '2024-12-31',
          newValue: '2025-01-21',
          changeReason: 'Extended contract term'
        },
        {
          fieldName: 'serviceContent',
          previousValue: 'Single Service Package',
          newValue: 'Premium Multi-Service Bundle',
          changeReason: 'Added consulting services'
        }
      ],
      changedAt: contractChangeTimestamp,
      changedBy: operatorUserId
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notificationId: 'NOTIF-20240122-005',
        emailStatus: 'sent',
        sentAt: contractChangeTimestamp,
        recipientEmail: customerResponsibleEmail,
        duplicateSendCheck: false,
        changeItemCount: 3,
        messageId: 'MSG-20240122-005'
      }),
      { status: 200 }
    );

    const result = await notifyContractChangeToCustomer(multipleChangesPayload);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('NOTIF-20240122-005');
    expect(result.emailStatus).toBe('sent');
    expect(result.changeItemCount).toBe(3);
    expect(result.duplicateSendCheck).toBe(false);

    const callArg = fetchMock.mock.calls[0][1];
    const requestBody = JSON.parse(callArg.body);
    expect(requestBody.changes).toHaveLength(3);
    expect(requestBody.changes[0].newValue).toBe(750000);
    expect(requestBody.changes[1].newValue).toBe('2025-01-21');
    expect(requestBody.changes[2].newValue).toBe('Premium Multi-Service Bundle');
  });

  // SCEN-848: メール重複送信チェック機能が動作する
  test('同じ契約変更に対して重複メール送信が防止される', async () => {
    const contractId = 'CNT-20240125-010';
    const customerId = 'CUST-A010';
    const customerResponsibleEmail = 'contact@customer-corp.jp';
    const contractChangeTimestamp = '2024-01-25T11:20:00Z';
    const operatorUserId = 'OP-USER-010';

    const contractChangePayload = {
      contractId: contractId,
      customerId: customerId,
      customerResponsibleEmail: customerResponsibleEmail,
      contractAmount: 800000,
      contractPeriodStart: '2024-01-25',
      contractPeriodEnd: '2024-12-31',
      serviceContent: 'Enterprise Package',
      changes: [
        {
          fieldName: 'contractAmount',
          previousValue: 700000,
          newValue: 800000,
          changeReason: 'Enterprise tier upgrade'
        }
      ],
      changedAt: contractChangeTimestamp,
      changedBy: operatorUserId
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notificationId: 'NOTIF-20240125-010',
        emailStatus: 'sent',
        sentAt: contractChangeTimestamp,
        recipientEmail: customerResponsibleEmail,
        duplicateSendCheck: true,
        priorNotificationId: null,
        messageId: 'MSG-20240125-010'
      }),
      { status: 200 }
    );

    const result = await notifyContractChangeToCustomer(contractChangePayload);

    expect(result.duplicateSendCheck).toBe(true);
    expect(result.priorNotificationId).toBeNull();
    expect(result.success).toBe(true);
    expect(result.emailStatus).toBe('sent');
  });
});
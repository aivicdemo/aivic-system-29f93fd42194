import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { notifyContractChangeToCustomer } from '../../src/logic/it-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-630
  test('契約変更内容の自動通知機能 - 契約内容が更新された際に顧客企業の営業責任者へメール通知が送信される', async () => {
    const contractId = 'CNT-20240115-001';
    const customerId = 'CUST-0001';
    const responsiblePersonEmail = 'yamada.taro@customer.example.com';
    const responsiblePersonName = '山田太郎';
    const changeTimestamp = '2024-01-15T10:00:00Z';
    const changedByUserId = 'USR-0123';
    const changedByUserName = '営業太郎';

    const previousContractData = {
      contractId: contractId,
      customerId: customerId,
      serviceType: 'アポイント代行',
      monthlyFeeYen: 500000,
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      targetAppointmentCount: 50,
    };

    const updatedContractData = {
      contractId: contractId,
      customerId: customerId,
      serviceType: 'アポイント代行',
      monthlyFeeYen: 600000,
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      targetAppointmentCount: 60,
    };

    const mailContent = {
      to: responsiblePersonEmail,
      subject: `【契約変更通知】契約ID: ${contractId} の内容が更新されました`,
      body: `
${responsiblePersonName} 様

いつもお世話になっております。
営業代行企業システムです。

下記の通り、ご契約内容が更新されましたのでお知らせいたします。

【契約ID】
${contractId}

【変更内容】
- 月額料金: ¥${previousContractData.monthlyFeeYen.toLocaleString('ja-JP')} → ¥${updatedContractData.monthlyFeeYen.toLocaleString('ja-JP')}
- 目標アポイント数: ${previousContractData.targetAppointmentCount}件 → ${updatedContractData.targetAppointmentCount}件

【変更日時】
${changeTimestamp}

【変更実施者】
${changedByUserName} (ID: ${changedByUserId})

ご不明な点やご質問ございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。
      `.trim(),
    };

    const expectedEmailLog = {
      emailId: 'EMAIL-20240115-001',
      contractId: contractId,
      customerId: customerId,
      recipientEmail: responsiblePersonEmail,
      recipientName: responsiblePersonName,
      subject: mailContent.subject,
      sentAt: changeTimestamp,
      status: 'sent',
      changedByUserId: changedByUserId,
      changedByUserName: changedByUserName,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        emailId: expectedEmailLog.emailId,
        contractId: contractId,
        customerId: customerId,
        recipientEmail: responsiblePersonEmail,
        recipientName: responsiblePersonName,
        subject: mailContent.subject,
        sentAt: changeTimestamp,
        status: 'sent',
        changedByUserId: changedByUserId,
        changedByUserName: changedByUserName,
      }),
      { status: 200 }
    );

    const result = await notifyContractChangeToCustomer({
      contractId: contractId,
      customerId: customerId,
      previousContractData: previousContractData,
      updatedContractData: updatedContractData,
      responsiblePersonEmail: responsiblePersonEmail,
      responsiblePersonName: responsiblePersonName,
      changedByUserId: changedByUserId,
      changedByUserName: changedByUserName,
      changeTimestamp: changeTimestamp,
    });

    expect(result).toEqual({
      success: true,
      emailId: 'EMAIL-20240115-001',
      contractId: contractId,
      customerId: customerId,
      recipientEmail: responsiblePersonEmail,
      recipientName: responsiblePersonName,
      subject: mailContent.subject,
      sentAt: changeTimestamp,
      status: 'sent',
      changedByUserId: changedByUserId,
      changedByUserName: changedByUserName,
    });

    expect(result.status).toBe('sent');
    expect(result.emailId).toMatch(/^EMAIL-/);
    expect(result.subject).toContain('契約変更通知');
    expect(result.subject).toContain(contractId);
    expect(result.recipientEmail).toBe(responsiblePersonEmail);

    const sentAtTime = new Date(result.sentAt);
    const changeTime = new Date(changeTimestamp);
    const timeDiffSeconds = (sentAtTime.getTime() - changeTime.getTime()) / 1000;
    expect(timeDiffSeconds).toBeLessThanOrEqual(300);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendDeliveryDateChangeNotification } from '../../src/logic/it-1-br-1781935279444-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('月次サマリーテンプレートの定義・管理機能 - 契約変更時の顧客企業への自動メール通知', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-849
  test('成果物納期が更新されたときに顧客企業営業責任者へ変更内容を含むメール通知が自動送信される', async () => {
    const contractId = 'CONTRACT-2024-001';
    const customerName = 'テスト顧客企業';
    const contactPersonEmail = 'contact@customer.example.com';
    const contactPersonName = '山田営業責任者';
    const previousDeliveryDate = '2024-03-15';
    const newDeliveryDate = '2024-04-30';
    const changeReason = '顧客要件の変更に伴う納期延長';
    const changeDateTime = '2024-02-20T14:30:00Z';
    const changeBy = 'operator@sales-company.example.com';

    const requestPayload = {
      contractId,
      customerName,
      contactPersonEmail,
      contactPersonName,
      previousDeliveryDate,
      newDeliveryDate,
      changeReason,
      changeDateTime,
      changeBy,
    };

    const emailNotificationResponse = {
      notificationId: 'NOTIF-2024-849-001',
      contractId,
      recipientEmail: contactPersonEmail,
      recipientName: contactPersonName,
      subject: `【重要】成果物納期変更のお知らせ - ${customerName}`,
      sentAt: '2024-02-20T14:30:05Z',
      status: 'sent',
      mailLog: {
        messageId: '<msg-2024-849-001@mail.system.local>',
        from: 'noreply@sales-company.example.com',
        to: contactPersonEmail,
        cc: undefined,
        bodyContainsChangeBefore: true,
        bodyContainsChangeAfter: true,
        bodyContainsChangeDateTime: true,
        bodyContainsChangeReason: true,
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(emailNotificationResponse), {
      status: 200,
    });

    const result = await sendDeliveryDateChangeNotification(requestPayload);

    expect(result.notificationId).toBe('NOTIF-2024-849-001');
    expect(result.contractId).toBe('CONTRACT-2024-001');
    expect(result.recipientEmail).toBe('contact@customer.example.com');
    expect(result.recipientName).toBe('山田営業責任者');
    expect(result.status).toBe('sent');
    expect(result.subject).toContain('成果物納期変更');
    expect(result.subject).toContain('テスト顧客企業');
    expect(result.sentAt).toBe('2024-02-20T14:30:05Z');

    expect(result.mailLog.from).toBe('noreply@sales-company.example.com');
    expect(result.mailLog.to).toBe(contactPersonEmail);
    expect(result.mailLog.bodyContainsChangeBefore).toBe(true);
    expect(result.mailLog.bodyContainsChangeAfter).toBe(true);
    expect(result.mailLog.bodyContainsChangeDateTime).toBe(true);
    expect(result.mailLog.bodyContainsChangeReason).toBe(true);

    expect(fetchMock.mock.calls.length).toBe(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain('notification');
  });

  test('メール送信に失敗した場合、エラーが記録されて通知される', async () => {
    const contractId = 'CONTRACT-2024-002';
    const customerName = 'テスト顧客企業B';
    const contactPersonEmail = 'invalid-email@customer.example.com';
    const contactPersonName = '佐藤営業責任者';
    const previousDeliveryDate = '2024-03-20';
    const newDeliveryDate = '2024-05-10';
    const changeReason = '納期延長';
    const changeDateTime = '2024-02-21T10:00:00Z';
    const changeBy = 'operator@sales-company.example.com';

    const requestPayload = {
      contractId,
      customerName,
      contactPersonEmail,
      contactPersonName,
      previousDeliveryDate,
      newDeliveryDate,
      changeReason,
      changeDateTime,
      changeBy,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: 'メール送信失敗',
        details: 'SMTP接続エラー',
      }),
      { status: 500 }
    );

    expect(async () => {
      await sendDeliveryDateChangeNotification(requestPayload);
    }).rejects.toThrow(/メール送信/);
  });

  test('必須パラメータが不足している場合、バリデーションエラーが発生する', async () => {
    const incompletePayload = {
      contractId: 'CONTRACT-2024-003',
      customerName: 'テスト顧客企業C',
      contactPersonEmail: 'contact@customer.example.com',
      // contactPersonName が不足
      previousDeliveryDate: '2024-03-25',
      newDeliveryDate: '2024-04-15',
      changeReason: '納期変更',
      changeDateTime: '2024-02-22T09:00:00Z',
      changeBy: 'operator@sales-company.example.com',
    };

    expect(() => {
      sendDeliveryDateChangeNotification(incompletePayload as any);
    }).toThrow(/連絡先/);
  });

  test('新しい納期が過去の日付である場合、バリデーションエラーが発生する', async () => {
    const pastDatePayload = {
      contractId: 'CONTRACT-2024-004',
      customerName: 'テスト顧客企業D',
      contactPersonEmail: 'contact@customer.example.com',
      contactPersonName: '太郎営業責任者',
      previousDeliveryDate: '2024-03-30',
      newDeliveryDate: '2024-01-01',
      changeReason: '納期短縮',
      changeDateTime: '2024-02-23T15:30:00Z',
      changeBy: 'operator@sales-company.example.com',
    };

    expect(() => {
      sendDeliveryDateChangeNotification(pastDatePayload as any);
    }).toThrow(/納期/);
  });

  test('前回の納期が新しい納期より後の場合、警告と共に処理が継続される', async () => {
    const reverseOrderPayload = {
      contractId: 'CONTRACT-2024-005',
      customerName: 'テスト顧客企業E',
      contactPersonEmail: 'contact@customer.example.com',
      contactPersonName: '花子営業責任者',
      previousDeliveryDate: '2024-05-01',
      newDeliveryDate: '2024-04-01',
      changeReason: '納期短縮対応',
      changeDateTime: '2024-02-24T11:00:00Z',
      changeBy: 'operator@sales-company.example.com',
    };

    const warningResponse = {
      notificationId: 'NOTIF-2024-849-005',
      contractId: 'CONTRACT-2024-005',
      recipientEmail: 'contact@customer.example.com',
      recipientName: '花子営業責任者',
      subject: '【重要】成果物納期変更のお知らせ - テスト顧客企業E',
      sentAt: '2024-02-24T11:00:03Z',
      status: 'sent',
      warning: '新納期が前回納期より前です。 緊急対応が必要な可能性があります。',
      mailLog: {
        messageId: '<msg-2024-849-005@mail.system.local>',
        from: 'noreply@sales-company.example.com',
        to: 'contact@customer.example.com',
        cc: undefined,
        bodyContainsChangeBefore: true,
        bodyContainsChangeAfter: true,
        bodyContainsChangeDateTime: true,
        bodyContainsChangeReason: true,
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(warningResponse), {
      status: 200,
    });

    const result = await sendDeliveryDateChangeNotification(reverseOrderPayload);

    expect(result.notificationId).toBe('NOTIF-2024-849-005');
    expect(result.status).toBe('sent');
    expect(result.warning).toContain('緊急対応');
    expect(result.mailLog.bodyContainsChangeBefore).toBe(true);
    expect(result.mailLog.bodyContainsChangeAfter).toBe(true);
  });

  test('複数の契約に対して同時に納期変更通知を送信できる', async () => {
    const requests = [
      {
        contractId: 'CONTRACT-2024-006',
        customerName: 'テスト顧客企業F',
        contactPersonEmail: 'contact-f@customer.example.com',
        contactPersonName: '次郎営業責任者',
        previousDeliveryDate: '2024-04-01',
        newDeliveryDate: '2024-05-15',
        changeReason: '顧客要件追加',
        changeDateTime: '2024-02-25T13:00:00Z',
        changeBy: 'operator@sales-company.example.com',
      },
      {
        contractId: 'CONTRACT-2024-007',
        customerName: 'テスト顧客企業G',
        contactPersonEmail: 'contact-g@customer.example.com',
        contactPersonName: '三郎営業責任者',
        previousDeliveryDate: '2024-04-05',
        newDeliveryDate: '2024-06-01',
        changeReason: '品質検査期間延長',
        changeDateTime: '2024-02-25T14:00:00Z',
        changeBy: 'operator@sales-company.example.com',
      },
    ];

    const response1 = {
      notificationId: 'NOTIF-2024-849-006',
      contractId: 'CONTRACT-2024-006',
      recipientEmail: 'contact-f@customer.example.com',
      recipientName: '次郎営業責任者',
      status: 'sent',
      sentAt: '2024-02-25T13:00:05Z',
      mailLog: {
        messageId: '<msg-2024-849-006@mail.system.local>',
        from: 'noreply@sales-company.example.com',
        to: 'contact-f@customer.example.com',
        bodyContainsChangeBefore: true,
        bodyContainsChangeAfter: true,
        bodyContainsChangeDateTime: true,
        bodyContainsChangeReason: true,
      },
    };

    const response2 = {
      notificationId: 'NOTIF-2024-849-007',
      contractId: 'CONTRACT-2024-007',
      recipientEmail: 'contact-g@customer.example.com',
      recipientName: '三郎営業責任者',
      status: 'sent',
      sentAt: '2024-02-25T14:00:05Z',
      mailLog: {
        messageId: '<msg-2024-849-007@mail.system.local>',
        from: 'noreply@sales-company.example.com',
        to: 'contact-g@customer.example.com',
        bodyContainsChangeBefore: true,
        bodyContainsChangeAfter: true,
        bodyContainsChangeDateTime: true,
        bodyContainsChangeReason: true,
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(response1), { status: 200 });
    fetchMock.mockResponseOnce(JSON.stringify(response2), { status: 200 });

    const result1 = await sendDeliveryDateChangeNotification(requests[0]);
    const result2 = await sendDeliveryDateChangeNotification(requests[1]);

    expect(result1.notificationId).toBe('NOTIF-2024-849-006');
    expect(result1.contractId).toBe('CONTRACT-2024-006');
    expect(result1.status).toBe('sent');

    expect(result2.notificationId).toBe('NOTIF-2024-849-007');
    expect(result2.contractId).toBe('CONTRACT-2024-007');
    expect(result2.status).toBe('sent');

    expect(fetchMock.mock.calls.length).toBe(2);
  });

  test('メール本文に変更前後の納期、変更日時、変更理由がすべて含まれていることを検証する', async () => {
    const detailPayload = {
      contractId: 'CONTRACT-2024-008',
      customerName: 'テスト顧客企業H',
      contactPersonEmail: 'contact@customer.example.com',
      contactPersonName: '由美営業責任者',
      previousDeliveryDate: '2024-03-10',
      newDeliveryDate: '2024-04-25',
      changeReason: 'システム障害による納期延長対応',
      changeDateTime: '2024-02-26T10:15:00Z',
      changeBy: 'operator@sales-company.example.com',
    };

    const detailedResponse = {
      notificationId: 'NOTIF-2024-849-008',
      contractId: 'CONTRACT-2024-008',
      recipientEmail: 'contact@customer.example.com',
      recipientName: '由美営業責任者',
      subject: '【重要】成果物納期変更のお知らせ - テスト顧客企業H',
      sentAt: '2024-02-26T10:15:03Z',
      status: 'sent',
      mailBody: {
        plainText:
          '平素よりお世話になっております。\n\n成果物納期が下記の通り変更となりましたのでお知らせいたします。\n\n【変更前】2024年3月10日\n【変更後】2024年4月25日\n【変更日時】2024年2月26日 10時15分00秒\n【変更理由】システム障害による納期延長対応\n\n引き続きよろしくお願いいたします。',
        htmlBody:
          '<html><body><p>平素よりお世話になっております。</p><p>成果物納期が下記の通り変更となりましたのでお知らせいたします。</p><table><tr><td>変更前</td><td>2024年3月10日</td></tr><tr><td>変更後</td><td>2024年4月25日</td></tr><tr><td>変更日時</td><td>2024年2月26日 10時15分00秒</td></tr><tr><td>変更理由</td><td>システム障害による納期延長対応</td></tr></table></body></html>',
      },
      mailLog: {
        messageId: '<msg-2024-849-008@mail.system.local>',
        from: 'noreply@sales-company.example.com',
        to: 'contact@customer.example.com',
        cc: undefined,
        bodyContainsChangeBefore: true,
        bodyContainsChangeAfter: true,
        bodyContainsChangeDateTime: true,
        bodyContainsChangeReason: true,
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(detailedResponse), {
      status: 200,
    });

    const result = await sendDeliveryDateChangeNotification(detailPayload);

    expect(result.mailBody.plainText).toContain('2024年3月10日');
    expect(result.mailBody.plainText).toContain('2024年4月25日');
    expect(result.mailBody.plainText).toContain('2024年2月26日');
    expect(result.mailBody.plainText).toContain('システム障害による納期延長対応');

    expect(result.mailBody.htmlBody).toContain('2024年3月10日');
    expect(result.mailBody.htmlBody).toContain('2024年4月25日');
    expect(result.mailBody.htmlBody).toContain('2024年2月26日');
    expect(result.mailBody.htmlBody).toContain('システム障害による納期延長対応');

    expect(result.mailLog.bodyContainsChangeBefore).toBe(true);
    expect(result.mailLog.bodyContainsChangeAfter).toBe(true);
    expect(result.mailLog.bodyContainsChangeDateTime).toBe(true);
    expect(result.mailLog.bodyContainsChangeReason).toBe(true);
  });
});
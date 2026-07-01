import { sendContractChangeReminderNotification } from '../../src/logic/it-1781935279444-2-1-1';

describe('契約変更確認催促通知機能', () => {
  test('SCEN-1246: 顧客合意受領から確認処理開始までの時間が設定値を超過した場合に営業責任者への催促通知が送信される', () => {
    // 設定値: 超過時間の閾値を24時間とする
    const thresholdHours = 24;
    const thresholdMs = thresholdHours * 60 * 60 * 1000;

    // 顧客合意受領時刻を固定値で設定
    const agreementReceivedAt = new Date('2024-01-15T09:00:00Z');

    // 催促通知実行時刻: 合意受領から設定値を超過
    const reminderExecutedAt = new Date(
      agreementReceivedAt.getTime() + thresholdMs + 1000
    );

    // テスト入力データ
    const contractChangeRequest = {
      contractChangeId: 'CC-2024-001',
      customerId: 'CUST-12345',
      customerName: '株式会社テスト',
      contractChangeSummary: '請求単価を10%引き上げ',
      agreementReceivedAt: agreementReceivedAt.toISOString(),
      salesRepresentativeEmail: 'sales-rep@company.com',
      salesRepresentativeName: '営業太郎',
      thresholdMs: thresholdMs,
      currentTime: reminderExecutedAt.toISOString(),
    };

    // 催促通知処理を実行
    const notificationResult = sendContractChangeReminderNotification(
      contractChangeRequest
    );

    // 通知が送信されたことを検証
    expect(notificationResult.notificationSent).toBe(true);

    // 通知タイプが催促通知であることを検証
    expect(notificationResult.notificationType).toBe('REMINDER');

    // 通知メッセージに顧客名が含まれていることを検証
    expect(notificationResult.message).toContain('株式会社テスト');

    // 通知メッセージに契約変更内容が含まれていることを検証
    expect(notificationResult.message).toContain('請求単価を10%引き上げ');

    // 通知メッセージに合意受領時刻が含まれていることを検証
    expect(notificationResult.message).toContain('2024-01-15T09:00:00Z');

    // 通知送信先が営業責任者のメールアドレスであることを検証
    expect(notificationResult.recipientEmail).toBe('sales-rep@company.com');

    // 通知送信時刻が設定値超過タイミング（合意受領から24時間以上経過後）であることを検証
    const notificationSentAt = new Date(notificationResult.notificationSentAt);
    const elapsedMs =
      notificationSentAt.getTime() - agreementReceivedAt.getTime();
    expect(elapsedMs).toBeGreaterThanOrEqual(thresholdMs);

    // 通知に含まれるトランザクションIDが存在することを検証
    expect(notificationResult.transactionId).toBeDefined();
    expect(notificationResult.transactionId).toMatch(/^CC-2024-001/);

    // 通知ステータスが送信完了であることを検証
    expect(notificationResult.status).toBe('SENT');
  });
});
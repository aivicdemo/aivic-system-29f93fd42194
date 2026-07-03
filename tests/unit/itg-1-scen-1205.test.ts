import { describe, test, expect } from '@jest/globals';
import {
  generateContractChangeNotificationEmail,
  ContractChangeEmailInput,
  ContractChangeEmailOutput,
} from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1205: [error] 変更内容メール自動生成・送信キュー追加 - メールアドレスが紐付いていない場合、メール生成処理がスキップされエラー通知が記録される
  test('メールアドレスが未設定の場合、メール生成がスキップされエラー通知が記録される', () => {
    // テストデータ: メールアドレスが紐付いていない営業データレコード
    const recordWithoutEmail: ContractChangeEmailInput = {
      contractId: 'CONTRACT-001',
      customerId: 'CUST-A01',
      changeContent: '納期を2024年3月15日から2024年4月15日に変更',
      changeType: 'delivery_date_change',
      changedBy: 'USER-REP001',
      changedAt: '2024-02-20T10:30:00Z',
      recipientEmail: null, // メールアドレスが未設定
      recipientName: '営業責任者太郎',
    };

    const recordWithEmail: ContractChangeEmailInput = {
      contractId: 'CONTRACT-002',
      customerId: 'CUST-B02',
      changeContent: '請求額を月額50,000円から月額55,000円に変更',
      changeType: 'billing_amount_change',
      changedBy: 'USER-REP001',
      changedAt: '2024-02-20T10:35:00Z',
      recipientEmail: 'sales@customer-b.com', // メールアドレスが設定
      recipientName: '営業責任者花子',
    };

    // 変更内容メール自動生成・送信機能を実行
    const resultNoEmail: ContractChangeEmailOutput = generateContractChangeNotificationEmail(
      recordWithoutEmail,
    );

    const resultWithEmail: ContractChangeEmailOutput = generateContractChangeNotificationEmail(
      recordWithEmail,
    );

    // メールアドレスが未設定の場合の検証
    // メール生成処理がスキップされたことを確認
    expect(resultNoEmail.emailGenerated).toBe(false);

    // エラー通知がシステムログに記録されたことを確認
    expect(resultNoEmail.errorOccurred).toBe(true);

    // エラー通知の内容に『メールアドレスが未設定』というエラーメッセージが含まれていることを確認
    expect(resultNoEmail.errorMessage).toMatch(/メールアドレス/);

    // メール送信キューにレコードが追加されていないことを確認
    expect(resultNoEmail.queueAdded).toBe(false);

    // ログレコードが記録されたことを確認
    expect(resultNoEmail.systemLogRecorded).toBe(true);
    expect(resultNoEmail.logLevel).toBe('error');

    // 他の正常なレコードの処理には影響がないことを確認
    expect(resultWithEmail.emailGenerated).toBe(true);
    expect(resultWithEmail.errorOccurred).toBe(false);
    expect(resultWithEmail.queueAdded).toBe(true);
    expect(resultWithEmail.systemLogRecorded).toBe(true);
    expect(resultWithEmail.logLevel).toBe('info');

    // 生成されたメールの内容を確認
    expect(resultWithEmail.generatedEmailSubject).toBe(
      '【営業代行企業】契約内容変更通知',
    );
    expect(resultWithEmail.generatedEmailBody).toContain('営業責任者花子');
    expect(resultWithEmail.generatedEmailBody).toContain(
      '請求額を月額50,000円から月額55,000円に変更',
    );

    // メール送信キューの追加内容を確認
    expect(resultWithEmail.queueRecord).toEqual({
      contractId: 'CONTRACT-002',
      recipientEmail: 'sales@customer-b.com',
      recipientName: '営業責任者花子',
      subject: '【営業代行企業】契約内容変更通知',
      status: 'pending',
      createdAt: '2024-02-20T10:35:00Z',
      scheduledSendAt: '2024-02-20T10:35:00Z',
    });

    // エラー通知の詳細確認
    expect(resultNoEmail.errorLog).toEqual({
      recordId: 'CONTRACT-001',
      errorCode: 'EMAIL_ADDRESS_NOT_SET',
      errorMessage: 'メールアドレスが未設定',
      affectedField: 'recipientEmail',
      timestamp: '2024-02-20T10:30:00Z',
      severity: 'error',
      processedRecord: recordWithoutEmail,
    });
  });
});
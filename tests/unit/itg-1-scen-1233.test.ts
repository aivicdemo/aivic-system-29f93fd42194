import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateContractChangeNotificationEmail } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  let emailQueue: Array<{ to: string; subject: string; body: string }>;
  let errorLogs: Array<{ timestamp: string; message: string; invalidEmail: string }>;

  beforeEach(() => {
    emailQueue = [];
    errorLogs = [];
  });

  // SCEN-1233: [error] 契約変更通知メール自動生成機能 - 営業責任者のメールアドレスが不正な形式の場合、メール生成がスキップされる
  test('営業責任者のメールアドレスが不正な形式の場合、メール生成がスキップされエラーログが出力される', () => {
    const contractChangeData = {
      contractId: 'CT-20240115-001',
      customerId: 'CUST-2024-001',
      changeDescription: '契約期間を3ヶ月延長',
      changedBy: 'representative@company.com',
      changeDate: '2024-01-15T09:30:00Z',
    };

    const invalidEmailPatterns = [
      { email: 'user@domain', pattern: 'no-tld' },
      { email: '@example.com', pattern: 'no-local-part' },
      { email: 'user name@example.com', pattern: 'space-in-local' },
      { email: 'user@example .com', pattern: 'space-in-domain' },
      { email: 'userexample.com', pattern: 'no-at-sign' },
      { email: 'user@@example.com', pattern: 'double-at-sign' },
    ];

    invalidEmailPatterns.forEach((invalidPattern) => {
      emailQueue = [];
      errorLogs = [];

      const salesManagerEmail = invalidPattern.email;

      const result = generateContractChangeNotificationEmail({
        contractChangeData,
        salesManagerEmail,
        onError: (errorMsg: string, invalidEmail: string) => {
          errorLogs.push({
            timestamp: new Date('2024-01-15T09:35:00Z').toISOString(),
            message: errorMsg,
            invalidEmail,
          });
        },
        onEmailQueued: (email: { to: string; subject: string; body: string }) => {
          emailQueue.push(email);
        },
      });

      expect(result).toEqual({
        success: false,
        emailGenerated: false,
        errorReason: 'メールアドレス形式が不正です',
        invalidEmailAddress: salesManagerEmail,
      });

      expect(emailQueue.length).toBe(0);

      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].invalidEmail).toBe(salesManagerEmail);
      expect(errorLogs[0].message).toMatch(/メールアドレス/);
      expect(errorLogs[0].message).toMatch(/形式/);
    });

    const validEmail = 'sales.manager@example.co.jp';
    emailQueue = [];
    errorLogs = [];

    const resultValid = generateContractChangeNotificationEmail({
      contractChangeData,
      salesManagerEmail: validEmail,
      onError: (errorMsg: string, invalidEmail: string) => {
        errorLogs.push({
          timestamp: new Date('2024-01-15T09:35:00Z').toISOString(),
          message: errorMsg,
          invalidEmail,
        });
      },
      onEmailQueued: (email: { to: string; subject: string; body: string }) => {
        emailQueue.push(email);
      },
    });

    expect(resultValid).toEqual({
      success: true,
      emailGenerated: true,
      errorReason: null,
      invalidEmailAddress: null,
    });

    expect(emailQueue.length).toBe(1);
    expect(emailQueue[0].to).toBe(validEmail);
    expect(emailQueue[0].subject).toMatch(/契約変更/);
    expect(emailQueue[0].body).toContain('契約期間を3ヶ月延長');

    expect(errorLogs.length).toBe(0);
  });
});
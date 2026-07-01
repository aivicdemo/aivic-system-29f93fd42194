import { describe, test, expect, beforeEach } from '@jest/globals';

const fetchMock = require('jest-fetch-mock');

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1236: [error] 契約変更メール送信と受信確認タイムスタンプ記録機能 - メール送信失敗時、エラーが返されて処理が中断される
  test('メール送信失敗時、エラーが返されて処理が中断される', async () => {
    const contractChangeData = {
      contractId: 'CONT-2024-001',
      changeContent: '請求額を月額50,000円から60,000円に変更',
      notificationEmail: 'customer@example.com',
      changedAt: new Date('2024-01-15T10:30:00Z'),
      changedBy: 'operator-001'
    };

    // メール送信失敗をモック化
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        errorCode: 'MAIL_SEND_ERROR',
        errorMessage: 'メール送信に失敗しました',
        timestamp: '2024-01-15T10:30:05Z'
      }),
      { status: 500 }
    );

    // logic モジュールから import
    const { processContractChangeWithEmailNotification } = await import(
      '../../src/logic/it-1781935279444-2-1-1'
    );

    // メール送信エラーが発生する場合をテスト
    const result = await processContractChangeWithEmailNotification(contractChangeData);

    // エラーレスポンスの検証
    expect(result).toEqual({
      success: false,
      errorCode: 'MAIL_SEND_ERROR',
      errorMessage: expect.stringMatching(/メール/),
      timestamp: '2024-01-15T10:30:05Z',
      contractChangeProcessed: false,
      databaseSaved: false
    });

    // 契約変更処理が中断されていることを確認
    expect(result.contractChangeProcessed).toBe(false);
    expect(result.databaseSaved).toBe(false);

    // エラーログにタイムスタンプが記録されていることを確認
    expect(result.timestamp).toBe('2024-01-15T10:30:05Z');

    // 詳細エラー情報の検証
    expect(result.errorCode).toBe('MAIL_SEND_ERROR');
  });
});
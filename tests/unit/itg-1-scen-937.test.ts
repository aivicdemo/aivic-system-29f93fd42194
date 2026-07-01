import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { notifyOverdueTask } from '../../src/logic/it-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-937
  test('期限超過時に代表への自動通知が正しく送信される', async () => {
    // 前提: 期限が本日より前のタスク
    const taskId = 'TASK-20240115-001';
    const taskName = '営業データ品質チェック';
    const dueDate = '2024-01-10T17:00:00Z'; // 本日(2024-01-15)より前
    const currentDate = '2024-01-15T09:00:00Z';
    const assigneeName = '田中太郎';
    const assigneeUserId = 'USER-002';
    const representativeEmail = 'representative@company.com';
    const representativeName = '代表者';

    // 入力データ
    const input = {
      taskId: taskId,
      taskName: taskName,
      dueDate: dueDate,
      assigneeUserId: assigneeUserId,
      assigneeName: assigneeName,
      currentDate: currentDate,
      notificationRecipientEmail: representativeEmail,
      notificationRecipientName: representativeName,
    };

    // モック: メール送信API
    fetchMock.mockResponseOnce(
      JSON.stringify({
        messageId: 'MSG-20240115-001',
        status: 'sent',
        timestamp: '2024-01-15T09:00:00Z',
      }),
      { status: 200 }
    );

    // 実行
    const result = await notifyOverdueTask(input);

    // 検証: 戻り値の構造
    expect(result).toEqual({
      notified: true,
      messageId: 'MSG-20240115-001',
      timestamp: '2024-01-15T09:00:00Z',
      recipientEmail: representativeEmail,
      taskName: taskName,
      taskId: taskId,
      dueDate: dueDate,
      overdueDays: 5,
    });

    // 検証: API呼び出し確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    const requestUrl = callArgs[0];
    const requestOptions = callArgs[1];

    // URL検証
    expect(requestUrl).toMatch(/notification|mail|alert/i);

    // リクエストボディ検証
    const requestBody = JSON.parse(requestOptions.body);
    expect(requestBody.taskId).toBe(taskId);
    expect(requestBody.taskName).toBe(taskName);
    expect(requestBody.recipientEmail).toBe(representativeEmail);
    expect(requestBody.recipientName).toBe(representativeName);

    // メール件名検証: 期限超過が明記されている
    expect(requestBody.subject).toMatch(/期限超過|overdue/i);

    // メール本文検証: 必須情報が含まれる
    expect(requestBody.body).toMatch(taskName);
    expect(requestBody.body).toMatch(assigneeName);
    expect(requestBody.body).toMatch(/5日/); // 経過日数
    expect(requestBody.body).toMatch(/2024-01-10/); // 期限日

    // リンク検証: タスクへのシステム内リンクが含まれる
    expect(requestBody.taskLink).toMatch(new RegExp(taskId));

    // HTTP メソッド検証
    expect(requestOptions.method).toBe('POST');

    // 送信元アドレス検証
    expect(requestBody.senderEmail).toMatch(/@company\.com$/);

    // 送信タイムスタンプ検証: currentDateと一致
    expect(result.timestamp).toBe(currentDate);
  });
});
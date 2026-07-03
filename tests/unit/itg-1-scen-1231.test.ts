import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateSLAExceededNotification } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能 - 契約変更SLA自動管理', () => {
  let mockCurrentTime: Date;

  beforeEach(() => {
    jest.useFakeTimers();
    mockCurrentTime = new Date('2024-01-15T09:00:00Z');
    jest.setSystemTime(mockCurrentTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-1231: 契約変更SLA自動管理機能 - SLA時間を超過した場合、超過通知が生成される
  test('SLA30分超過時に超過通知が自動生成され、状態が更新され、担当者に通知が送信される', () => {
    // テストデータ: SLA時間30分の契約変更案件
    const contractChangeId = 'CC-2024-001';
    const slaMinutes = 30;
    const changeStartTime = new Date('2024-01-15T09:00:00Z');
    const assignedUserId = 'user-rep-001';
    const assignedUserEmail = 'representative@company.com';

    // 契約変更処理を開始した時点でシステム時刻を記録
    const processStartTime = new Date(mockCurrentTime);

    // SLA時間の30分が経過するまで待機（システム時刻を30分以上進める）
    const timeAfterSLAExpiry = new Date(changeStartTime.getTime() + (slaMinutes + 5) * 60 * 1000); // 35分経過
    jest.setSystemTime(timeAfterSLAExpiry);

    // 超過通知生成関数を呼び出し
    const notificationResult = generateSLAExceededNotification({
      contractChangeId,
      slaMinutes,
      changeStartTime,
      currentTime: timeAfterSLAExpiry,
      assignedUserId,
      assignedUserEmail,
    });

    // 検証1: 超過通知が生成されていることを確認
    expect(notificationResult).toBeDefined();
    expect(notificationResult.notificationId).toMatch(/^NOTIF-/);

    // 検証2: 超過時間が正確に計算されていることを確認
    const elapsedMinutes = (timeAfterSLAExpiry.getTime() - changeStartTime.getTime()) / (1000 * 60);
    const exceedMinutes = elapsedMinutes - slaMinutes;
    expect(notificationResult.exceedMinutes).toBe(5);
    expect(notificationResult.exceedMinutes).toBeGreaterThan(0);

    // 検証3: 契約変更案件の状態が『SLA超過』に更新されたことを確認
    expect(notificationResult.contractChangeStatus).toBe('SLA_EXCEEDED');

    // 検証4: 生成された通知メッセージに超過内容が含まれていることを確認
    expect(notificationResult.notificationMessage).toContain('契約変更');
    expect(notificationResult.notificationMessage).toContain('SLA');
    expect(notificationResult.notificationMessage).toContain('5');
    expect(notificationResult.notificationMessage).toContain('超過');

    // 検証5: 通知が指定の担当者に正しく送信されたことを確認
    expect(notificationResult.recipientUserId).toBe(assignedUserId);
    expect(notificationResult.recipientEmail).toBe(assignedUserEmail);
    expect(notificationResult.notificationType).toBe('SLA_EXCEEDED');

    // 検証6: 通知生成時刻が現在時刻であることを確認
    expect(notificationResult.notificationGeneratedAt).toEqual(timeAfterSLAExpiry);

    // 検証7: 通知の優先度がEXHIGHに設定されていることを確認
    expect(notificationResult.priorityLevel).toBe('HIGH');

    // 検証8: SLA時間内の場合は通知が生成されないことを確認（境界値テスト）
    const timeWithinSLA = new Date(changeStartTime.getTime() + (slaMinutes - 5) * 60 * 1000); // 25分経過
    const withinSLAResult = generateSLAExceededNotification({
      contractChangeId,
      slaMinutes,
      changeStartTime,
      currentTime: timeWithinSLA,
      assignedUserId,
      assignedUserEmail,
    });
    expect(withinSLAResult.isExceeded).toBe(false);
    expect(withinSLAResult.notificationId).toBeNull();

    // 検証9: SLA時間ちょうどの場合は超過と判定されないことを確認（境界値）
    const timeAtSLABoundary = new Date(changeStartTime.getTime() + slaMinutes * 60 * 1000);
    const boundaryResult = generateSLAExceededNotification({
      contractChangeId,
      slaMinutes,
      changeStartTime,
      currentTime: timeAtSLABoundary,
      assignedUserId,
      assignedUserEmail,
    });
    expect(boundaryResult.isExceeded).toBe(false);
  });
});
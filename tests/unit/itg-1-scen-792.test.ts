import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  calculateSLAExceeded,
  sendDelayedAlertNotification,
  recordAlertHistory,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理 - SLA管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-792: 最新版リリース通知から資料確認までのSLA管理機能
  test('SLA超過時間を経過した時点で、代表ユーザーに遅延アラートメールが送信され、アラート履歴に記録される', async () => {
    // Arrange: SLA設定（2時間）とリリース通知の作成
    const slaTimeoutMinutes = 120; // 2時間
    const releaseNotificationId = 'SCEN-792-NOTICE-001';
    const notificationIssuedAt = new Date('2024-01-15T09:00:00Z');
    const representativeUserId = 'REP-USER-001';
    const representativeEmail = 'rep@example.com';
    const currentSystemTime = new Date('2024-01-15T11:30:00Z'); // 2時間30分後（SLA超過）

    // SLA超過判定用のデータ
    const elapsedMinutes = (currentSystemTime.getTime() - notificationIssuedAt.getTime()) / (1000 * 60);
    const isSLAExceeded = elapsedMinutes > slaTimeoutMinutes;

    // Act 1: SLA超過時間の計算
    const slaExceededResult = calculateSLAExceeded({
      notificationIssuedAt,
      currentSystemTime,
      slaTimeoutMinutes,
    });

    // Assert 1: SLA超過判定の検証
    expect(slaExceededResult.isExceeded).toBe(true);
    expect(slaExceededResult.exceededMinutes).toBe(30); // 2時間30分 - 2時間 = 30分超過

    // Act 2: 遅延アラート通知の送信
    const alertNotificationResult = await sendDelayedAlertNotification({
      releaseNotificationId,
      representativeUserId,
      representativeEmail,
      notificationIssuedAt,
      currentSystemTime,
      slaTimeoutMinutes,
      exceededMinutes: slaExceededResult.exceededMinutes,
    });

    // Assert 2: アラート通知の送信結果を検証
    expect(alertNotificationResult.success).toBe(true);
    expect(alertNotificationResult.emailSent).toBe(true);
    expect(alertNotificationResult.recipientEmail).toBe('rep@example.com');
    expect(alertNotificationResult.alertSubject).toBe(
      `リリース通知${releaseNotificationId}の資料確認がSLA超過しています`
    );
    expect(alertNotificationResult.alertMessage).toContain('30分');
    expect(alertNotificationResult.alertMessage).toContain('SLA超過');

    // Act 3: アラート履歴の記録
    const alertHistoryRecord = await recordAlertHistory({
      releaseNotificationId,
      representativeUserId,
      representativeEmail,
      alertType: 'SLA_EXCEEDED',
      notificationIssuedAt,
      currentSystemTime,
      slaTimeoutMinutes,
      exceededMinutes: slaExceededResult.exceededMinutes,
      alertSentAt: new Date('2024-01-15T11:30:00Z'),
      alertStatus: 'SENT',
    });

    // Assert 3: アラート履歴の記録を検証
    expect(alertHistoryRecord.recordId).toBeDefined();
    expect(alertHistoryRecord.releaseNotificationId).toBe('SCEN-792-NOTICE-001');
    expect(alertHistoryRecord.alertType).toBe('SLA_EXCEEDED');
    expect(alertHistoryRecord.exceededMinutes).toBe(30);
    expect(alertHistoryRecord.alertStatus).toBe('SENT');
    expect(alertHistoryRecord.representativeUserId).toBe('REP-USER-001');
    expect(alertHistoryRecord.createdAt).toEqual(new Date('2024-01-15T11:30:00Z'));

    // Assert 4: 統合的な確認
    // SLA超過判定 → アラート通知送信 → 履歴記録 の全プロセスが成功していることを確認
    expect(isSLAExceeded).toBe(true);
    expect(alertNotificationResult.success && alertHistoryRecord.recordId).toBe(true);
    expect(alertHistoryRecord.alertSentAt).toEqual(new Date('2024-01-15T11:30:00Z'));
  });
});
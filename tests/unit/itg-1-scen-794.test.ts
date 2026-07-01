import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMaterialConfirmationSlaCompliance } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理 - SLA管理機能', () => {
  let mockCurrentTime: Date;

  beforeEach(() => {
    mockCurrentTime = new Date('2024-01-15T09:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-794
  test('最新版リリース通知から資料確認までのSLA時間が境界値（ちょうど24時間）の場合、処理が続行される', () => {
    const notificationSentAt = new Date('2024-01-15T09:00:00Z');
    const slaTimeInHours = 24;
    const materialConfirmationCompletedAt = new Date('2024-01-16T09:00:00Z');

    const result = validateMaterialConfirmationSlaCompliance({
      notificationSentTimestamp: notificationSentAt.toISOString(),
      materialConfirmationCompletedTimestamp: materialConfirmationCompletedAt.toISOString(),
      slaTimeInHours,
    });

    expect(result.isSlaBreach).toBe(false);
    expect(result.elapsedTimeInHours).toBe(24);
    expect(result.processContinues).toBe(true);
    expect(result.status).toBe('完了');
    expect(result.slaViolationFlag).toBe(false);
    expect(result.canProceedToNextProcess).toBe(true);
  });
});
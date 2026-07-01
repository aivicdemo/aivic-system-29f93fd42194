import { describe, test, expect, beforeEach } from '@jest/globals';
import { checkContractChangeReminder } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('SCEN-1247: 契約変更確認催促通知機能 - 経過時間が設定値以内の場合に催促通知が送信されない', () => {
    // Arrange: テスト環境の設定値（24時間）とタイムスタンプ
    const reminder_threshold_hours = 24;
    const agreement_received_at = new Date('2024-01-15T10:00:00Z');
    const confirmation_started_at = new Date('2024-01-15T22:00:00Z');

    // 経過時間: 12時間 (設定値24時間以内)
    const elapsed_hours = (confirmation_started_at.getTime() - agreement_received_at.getTime()) / (1000 * 60 * 60);

    const contract_change_id = 'CONTRACT_CHG_001';
    const customer_id = 'CUST_001';
    const reminder_setting = {
      threshold_hours: reminder_threshold_hours,
      enabled: true,
    };

    // Act: 契約変更確認催促通知チェック関数を実行
    const result = checkContractChangeReminder({
      contract_change_id: contract_change_id,
      customer_id: customer_id,
      agreement_received_at: agreement_received_at,
      confirmation_started_at: confirmation_started_at,
      reminder_threshold_hours: reminder_threshold_hours,
    });

    // Assert: 経過時間が設定値以内の場合、催促通知が送信されないこと
    expect(result).toEqual({
      should_send_reminder: false,
      elapsed_hours: 12,
      threshold_hours: 24,
      reason: '確認処理開始までの経過時間が設定値以内のため、催促通知は不要',
    });
  });
});
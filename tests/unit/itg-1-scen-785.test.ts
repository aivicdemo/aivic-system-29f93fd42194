import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { checkSlaExceeded } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - SLA監視', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-785: [edge] 資料リリース通知から確認完了までのSLA監視機能 - SLA期限を1秒超過した場合、アラート対象として判定する
  test('SLA期限を1秒超過した場合、アラート対象として判定し、アラート通知が発火される', () => {
    // テスト環境でのタイムスタンプを固定
    const release_timestamp = new Date('2024-12-15T09:00:00Z');
    const sla_limit_seconds = 86400; // 24時間 (秒)
    const sla_deadline = new Date(release_timestamp.getTime() + sla_limit_seconds * 1000);
    
    // SLA期限を1秒超過した時刻
    const exceeded_check_timestamp = new Date(sla_deadline.getTime() + 1000); // +1秒
    
    // 入力: 資料リリース通知時刻、SLA期限秒、現在時刻
    const sla_result = checkSlaExceeded({
      release_timestamp: release_timestamp.toISOString(),
      sla_limit_seconds: sla_limit_seconds,
      current_timestamp: exceeded_check_timestamp.toISOString()
    });

    // 期待結果1: SLA超過フラグが true
    expect(sla_result.is_exceeded).toBe(true);

    // 期待結果2: 超過時間が1秒として正確に記録
    expect(sla_result.exceeded_seconds).toBe(1);

    // 期待結果3: アラート判定ステータスが 'alert' または true
    expect(sla_result.alert_status).toBe('alert');

    // 期待結果4: アラート通知フラグが発火
    expect(sla_result.alert_fired).toBe(true);

    // 期待結果5: 監視ログに超過時間が記録されている
    expect(sla_result.monitoring_log).toBeDefined();
    expect(sla_result.monitoring_log.exceeded_duration_ms).toBe(1000);

    // 期待結果6: 監視ログのタイムスタンプが現在時刻として記録
    expect(sla_result.monitoring_log.check_timestamp).toBe(exceeded_check_timestamp.toISOString());
  });
});
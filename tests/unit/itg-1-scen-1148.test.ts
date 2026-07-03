import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateAndDistributeMonthlyReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1148: [edge] 月次レポート生成・配信期限管理機能 - 期限直前の完了時に通知は発行されず正常完了する
  test('期限直前（1分以内）にレポート生成が完了した場合、期限超過アラートは発行されず正常完了ステータスで記録される', () => {
    const base_time = new Date('2024-01-15T11:59:00Z');
    const deadline = new Date('2024-01-15T12:00:00Z'); // base_time の 1 分後
    const completion_time = new Date('2024-01-15T11:59:55Z'); // deadline の 5 秒前
    const template_id = 'tpl_monthly_001';
    const report_config = {
      template_id: template_id,
      target_customers: ['cust_001', 'cust_002'],
      deadline: deadline.toISOString(),
    };

    const result = generateAndDistributeMonthlyReport({
      base_time: base_time.toISOString(),
      report_config: report_config,
      completion_time: completion_time.toISOString(),
    });

    expect(result.status).toBe('completed');
    expect(result.alert_issued).toBe(false);
    expect(result.deadline_exceeded).toBe(false);
    expect(result.distribution_status).toBe('success');
    expect(result.completion_time).toBe(completion_time.toISOString());
    expect(result.deadline_time).toBe(deadline.toISOString());
    expect(result.time_to_deadline_seconds).toBe(5);
  });
});
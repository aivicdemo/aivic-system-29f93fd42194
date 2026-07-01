import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setDueDateByPriority } from '../../src/logic/it-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-828: [normal] 対応期限の自動設定機能 - 優先度に応じた対応期限が自動設定され、代表への通知と共に記録される
  test('優先度に応じて対応期限が自動設定され、通知・履歴記録される', async () => {
    const case_high_priority = {
      case_name: 'case_high_priority',
      project_id: 'PRJ-2024-001',
      priority: 'high',
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'sales_staff_001',
    };

    const case_medium_priority = {
      case_name: 'case_medium_priority',
      project_id: 'PRJ-2024-002',
      priority: 'medium',
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'sales_staff_002',
    };

    const case_low_priority = {
      case_name: 'case_low_priority',
      project_id: 'PRJ-2024-003',
      priority: 'low',
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'sales_staff_003',
    };

    // 高優先度: 翌営業日（2024-01-16）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        project_id: case_high_priority.project_id,
        priority: case_high_priority.priority,
        due_date: '2024-01-16',
        notification_sent: true,
        notification_recipient: 'representative@company.com',
        history_recorded: true,
      }),
      { status: 200 }
    );

    const result_high = await setDueDateByPriority(case_high_priority);

    expect(result_high.project_id).toBe('PRJ-2024-001');
    expect(result_high.due_date).toBe('2024-01-16');
    expect(result_high.notification_sent).toBe(true);
    expect(result_high.notification_recipient).toBe('representative@company.com');
    expect(result_high.history_recorded).toBe(true);

    // 中優先度: 3営業日以内（2024-01-18）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        project_id: case_medium_priority.project_id,
        priority: case_medium_priority.priority,
        due_date: '2024-01-18',
        notification_sent: true,
        notification_recipient: 'representative@company.com',
        history_recorded: true,
      }),
      { status: 200 }
    );

    const result_medium = await setDueDateByPriority(case_medium_priority);

    expect(result_medium.project_id).toBe('PRJ-2024-002');
    expect(result_medium.due_date).toBe('2024-01-18');
    expect(result_medium.notification_sent).toBe(true);
    expect(result_medium.notification_recipient).toBe('representative@company.com');
    expect(result_medium.history_recorded).toBe(true);

    // 低優先度: 1週間以内（2024-01-22）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        project_id: case_low_priority.project_id,
        priority: case_low_priority.priority,
        due_date: '2024-01-22',
        notification_sent: true,
        notification_recipient: 'representative@company.com',
        history_recorded: true,
      }),
      { status: 200 }
    );

    const result_low = await setDueDateByPriority(case_low_priority);

    expect(result_low.project_id).toBe('PRJ-2024-003');
    expect(result_low.due_date).toBe('2024-01-22');
    expect(result_low.notification_sent).toBe(true);
    expect(result_low.notification_recipient).toBe('representative@company.com');
    expect(result_low.history_recorded).toBe(true);

    // 各優先度で異なる期限が設定されたことを確認
    expect(result_high.due_date).not.toBe(result_medium.due_date);
    expect(result_medium.due_date).not.toBe(result_low.due_date);

    // 高優先度が最短、低優先度が最長であることを確認
    const due_date_high = new Date(result_high.due_date);
    const due_date_medium = new Date(result_medium.due_date);
    const due_date_low = new Date(result_low.due_date);

    expect(due_date_high.getTime()).toBeLessThan(due_date_medium.getTime());
    expect(due_date_medium.getTime()).toBeLessThan(due_date_low.getTime());

    // すべてのケースで通知が送信されたことを確認
    expect(result_high.notification_sent).toBe(true);
    expect(result_medium.notification_sent).toBe(true);
    expect(result_low.notification_sent).toBe(true);

    // すべてのケースで履歴記録されたことを確認
    expect(result_high.history_recorded).toBe(true);
    expect(result_medium.history_recorded).toBe(true);
    expect(result_low.history_recorded).toBe(true);

    // 無効な優先度が入力された場合のエラー
    const case_invalid_priority = {
      case_name: 'case_invalid',
      project_id: 'PRJ-2024-999',
      priority: 'invalid',
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'sales_staff_invalid',
    };

    expect(() => setDueDateByPriority(case_invalid_priority)).toThrow(/優先度/);
  });
});
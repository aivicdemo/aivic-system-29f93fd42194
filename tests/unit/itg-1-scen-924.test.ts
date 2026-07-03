import { describe, test, expect } from '@jest/globals';
import { assignMonthlyScheduleAndNotify } from '../../src/logic/it-1-2-1';

describe('月次業務スケジュール自動割り当てと期限超過判定', () => {
  // SCEN-924: 月次業務スケジュール自動割り当て - 期限超過判定が正確に計算され、代表への通知フラグが設定される
  test('期限超過判定ロジックが実行され、超過業務に通知フラグが正しく設定される', () => {
    const baselineDate = new Date('2024-02-15T09:00:00Z');
    const mockScheduleList = [
      {
        taskId: 'task_001',
        taskName: '営業データ品質チェック',
        scheduledDeadline: new Date('2024-02-14T17:00:00Z'),
        notificationFlagForRepresentative: false,
        executionStatus: 'pending',
      },
      {
        taskId: 'task_002',
        taskName: '請求書作成チェックリスト実行',
        scheduledDeadline: new Date('2024-02-20T17:00:00Z'),
        notificationFlagForRepresentative: false,
        executionStatus: 'pending',
      },
      {
        taskId: 'task_003',
        taskName: '営業報告書集計',
        scheduledDeadline: new Date('2024-02-10T17:00:00Z'),
        notificationFlagForRepresentative: false,
        executionStatus: 'pending',
      },
      {
        taskId: 'task_004',
        taskName: '請求額計算結果検証',
        scheduledDeadline: new Date('2024-02-25T17:00:00Z'),
        notificationFlagForRepresentative: false,
        executionStatus: 'pending',
      },
    ];

    const result = assignMonthlyScheduleAndNotify(mockScheduleList, baselineDate);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);

    const task001 = result.find((t: any) => t.taskId === 'task_001');
    expect(task001).toBeDefined();
    expect(task001?.notificationFlagForRepresentative).toBe(true);
    expect(task001?.executionStatus).toBe('pending');

    const task002 = result.find((t: any) => t.taskId === 'task_002');
    expect(task002).toBeDefined();
    expect(task002?.notificationFlagForRepresentative).toBe(false);

    const task003 = result.find((t: any) => t.taskId === 'task_003');
    expect(task003).toBeDefined();
    expect(task003?.notificationFlagForRepresentative).toBe(true);

    const task004 = result.find((t: any) => t.taskId === 'task_004');
    expect(task004).toBeDefined();
    expect(task004?.notificationFlagForRepresentative).toBe(false);

    const overdueCount = result.filter((t: any) => t.notificationFlagForRepresentative === true).length;
    expect(overdueCount).toBe(2);

    const withinDeadlineCount = result.filter((t: any) => t.notificationFlagForRepresentative === false).length;
    expect(withinDeadlineCount).toBe(2);

    result.forEach((task: any) => {
      expect(task.taskId).toBeDefined();
      expect(task.taskName).toBeDefined();
      expect(task.scheduledDeadline).toBeDefined();
      expect(typeof task.notificationFlagForRepresentative).toBe('boolean');
    });
  });
});
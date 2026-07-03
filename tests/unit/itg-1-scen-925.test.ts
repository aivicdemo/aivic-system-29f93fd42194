import { assignSchedulePeriodLimits } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-925: [edge] 月次業務スケジュール自動割り当て - スケジュール実行日時が指定日時より前の場合、期限割り当てが実行されない
  test('スケジュール実行日時が期限割り当て予定日時より前の場合、期限割り当てタスクは実行されない', () => {
    const scheduleExecutionDateTime = new Date('2024-01-15T09:00:00Z');
    const deadlineAssignmentScheduledDateTime = new Date('2024-01-15T10:00:00Z');
    const currentDateTime = new Date('2024-01-15T08:30:00Z');

    const result = assignSchedulePeriodLimits({
      scheduleExecutionDateTime,
      deadlineAssignmentScheduledDateTime,
      currentDateTime,
    });

    expect(result.executionStatus).toBe('スキップ');
    expect(result.hasExecuted).toBe(false);
    expect(result.skipReason).toBe('スケジュール実行日時が指定日時より前');
    expect(result.logEntry).toMatchObject({
      timestamp: '2024-01-15T08:30:00Z',
      action: '期限割り当て',
      status: 'スキップ',
      reason: 'スケジュール実行日時が指定日時より前',
    });
  });
});
import { recordActionPlan } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-824: [edge] 対応方針の記録・ステータス更新機能 - 実施予定日時が現在時刻より前の値で指定された場合、エラーが返却される
  test('実施予定日時が現在時刻より前の値で指定された場合、エラーが返却される', () => {
    const now = new Date('2024-12-15T10:00:00Z');
    const pastScheduledTime = new Date('2024-12-15T09:00:00Z'); // 現在時刻の1時間前

    const actionPlanData = {
      decision_type: 'modify_support',
      reason: '顧客からの要件変更に対応',
      scheduled_execution_time: pastScheduledTime.toISOString(),
      assigned_to: 'user-001',
      priority_level: 'high',
      contract_id: 'contract-789',
      status: 'pending'
    };

    expect(() => recordActionPlan(actionPlanData, now)).toThrow(/実施予定日時/);
  });
});
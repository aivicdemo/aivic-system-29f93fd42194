import { evaluateImprovementTargetAchievement } from '../../src/logic/it-6-2-1-1';

describe('改善目標値達成判定と次ステップ自動決定', () => {
  // SCEN-1231
  test('改善目標値に達成した場合、運用継続が自動決定される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 85,
      evaluation_timestamp: new Date('2024-01-15T10:00:00Z'),
      assessor_id: 'ASS001',
      improvement_cycle_id: 'CYC20240115001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result).toEqual({
      judgment_status: '運用継続',
      target_achieved: true,
      achievement_rate_percentage: 100,
      next_step: '運用継続',
      next_step_decision_timestamp: new Date('2024-01-15T10:00:00Z'),
      improvement_cycle_id: 'CYC20240115001',
      assessor_id: 'ASS001',
      decision_reason: '目標値85%以上を達成',
      database_save_status: 'success',
      notification_status: 'sent',
      log_recorded: true,
    });

    expect(result.judgment_status).toBe('運用継続');
    expect(result.target_achieved).toBe(true);
    expect(result.achievement_rate_percentage).toBe(100);
    expect(result.next_step).toBe('運用継続');
    expect(result.database_save_status).toBe('success');
    expect(result.notification_status).toBe('sent');
    expect(result.log_recorded).toBe(true);
  });

  test('改善目標値を上回った場合、運用継続が自動決定される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 92,
      evaluation_timestamp: new Date('2024-01-16T11:30:00Z'),
      assessor_id: 'ASS002',
      improvement_cycle_id: 'CYC20240116001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.judgment_status).toBe('運用継続');
    expect(result.target_achieved).toBe(true);
    expect(result.achievement_rate_percentage).toBe(108.235);
    expect(result.next_step).toBe('運用継続');
  });

  test('改善目標値を下回った場合、追加改善が自動決定される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 78,
      evaluation_timestamp: new Date('2024-01-17T09:00:00Z'),
      assessor_id: 'ASS003',
      improvement_cycle_id: 'CYC20240117001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.judgment_status).toBe('追加改善必要');
    expect(result.target_achieved).toBe(false);
    expect(result.achievement_rate_percentage).toBe(91.765);
    expect(result.next_step).toBe('追加改善');
    expect(result.database_save_status).toBe('success');
  });

  test('改善目標値が大幅に下回った場合、ロールバック検討が自動決定される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 65,
      evaluation_timestamp: new Date('2024-01-18T14:20:00Z'),
      assessor_id: 'ASS004',
      improvement_cycle_id: 'CYC20240118001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.judgment_status).toBe('ロールバック検討');
    expect(result.target_achieved).toBe(false);
    expect(result.achievement_rate_percentage).toBe(76.471);
    expect(result.next_step).toBe('ロールバック実行');
    expect(result.database_save_status).toBe('success');
  });

  test('実績値が目標値と同一の場合、タイムスタンプが正しく記録される', () => {
    const evaluation_time = new Date('2024-01-19T16:45:30Z');
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 85,
      evaluation_timestamp: evaluation_time,
      assessor_id: 'ASS005',
      improvement_cycle_id: 'CYC20240119001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.next_step_decision_timestamp).toEqual(evaluation_time);
    expect(result.log_recorded).toBe(true);
  });

  test('目標値達成判定時に不正な値が渡された場合、エラーが発生する', () => {
    const invalid_input = {
      target_achievement_rate: -10,
      actual_achievement_rate: 85,
      evaluation_timestamp: new Date('2024-01-20T10:00:00Z'),
      assessor_id: 'ASS006',
      improvement_cycle_id: 'CYC20240120001',
    };

    expect(() =>
      evaluateImprovementTargetAchievement(invalid_input)
    ).toThrow(/目標値/);
  });

  test('実績値が負数の場合、エラーが発生する', () => {
    const invalid_input = {
      target_achievement_rate: 85,
      actual_achievement_rate: -5,
      evaluation_timestamp: new Date('2024-01-21T10:00:00Z'),
      assessor_id: 'ASS007',
      improvement_cycle_id: 'CYC20240121001',
    };

    expect(() =>
      evaluateImprovementTargetAchievement(invalid_input)
    ).toThrow(/実績値/);
  });

  test('査定員IDが空の場合、エラーが発生する', () => {
    const invalid_input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 85,
      evaluation_timestamp: new Date('2024-01-22T10:00:00Z'),
      assessor_id: '',
      improvement_cycle_id: 'CYC20240122001',
    };

    expect(() =>
      evaluateImprovementTargetAchievement(invalid_input)
    ).toThrow(/査定員/);
  });

  test('改善サイクルIDが未設定の場合、エラーが発生する', () => {
    const invalid_input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 85,
      evaluation_timestamp: new Date('2024-01-23T10:00:00Z'),
      assessor_id: 'ASS008',
      improvement_cycle_id: '',
    };

    expect(() =>
      evaluateImprovementTargetAchievement(invalid_input)
    ).toThrow(/サイクルID/);
  });

  test('実績値が100を超過した場合、達成率が正しく計算される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 95,
      evaluation_timestamp: new Date('2024-01-24T10:00:00Z'),
      assessor_id: 'ASS009',
      improvement_cycle_id: 'CYC20240124001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.achievement_rate_percentage).toBe(111.765);
    expect(result.target_achieved).toBe(true);
  });

  test('達成判定結果がデータベースに正しく保存される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 88,
      evaluation_timestamp: new Date('2024-01-25T13:15:00Z'),
      assessor_id: 'ASS010',
      improvement_cycle_id: 'CYC20240125001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.database_save_status).toBe('success');
    expect(result.judgment_status).toBeDefined();
    expect(result.next_step).toBeDefined();
  });

  test('運用継続フラグが正しく設定される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 87,
      evaluation_timestamp: new Date('2024-01-26T11:00:00Z'),
      assessor_id: 'ASS011',
      improvement_cycle_id: 'CYC20240126001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.next_step).toBe('運用継続');
    expect(result.judgment_status).toBe('運用継続');
    expect(result.target_achieved).toBe(true);
  });

  test('通知が正しく送信される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 90,
      evaluation_timestamp: new Date('2024-01-27T09:30:00Z'),
      assessor_id: 'ASS012',
      improvement_cycle_id: 'CYC20240127001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.notification_status).toBe('sent');
  });

  test('関連ログが正しく記録される', () => {
    const input = {
      target_achievement_rate: 85,
      actual_achievement_rate: 85,
      evaluation_timestamp: new Date('2024-01-28T15:45:00Z'),
      assessor_id: 'ASS013',
      improvement_cycle_id: 'CYC20240128001',
    };

    const result = evaluateImprovementTargetAchievement(input);

    expect(result.log_recorded).toBe(true);
    expect(result.decision_reason).toBe('目標値85%以上を達成');
  });
});
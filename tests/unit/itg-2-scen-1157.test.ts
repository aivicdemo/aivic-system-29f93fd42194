import { recordImprovementEffectVerificationFeedback } from '../../src/logic/it-6-3-1';

describe('査定判定ロジック適用履歴と根拠記録・検索 - 改善効果検証フィードバック', () => {
  test('SCEN-1157: 改善効果検証期間が1日未満の場合、フィードバック記録を受け付けずエラーを返す', () => {
    const improvement_item_id = 'IMPROVE_001';
    const verification_start_datetime = new Date('2024-01-15T10:00:00Z');
    const verification_end_datetime = new Date('2024-01-15T15:00:00Z');
    const feedback_comment = '改善効果を確認しました';
    const recorded_by_user_id = 'USER_001';

    expect(() =>
      recordImprovementEffectVerificationFeedback({
        improvement_item_id,
        verification_start_datetime,
        verification_end_datetime,
        feedback_comment,
        recorded_by_user_id,
      })
    ).toThrow(/検証期間は1日以上/);
  });

  test('SCEN-1157: 改善効果検証期間が1日以上の場合、フィードバック記録が正常に保存される', () => {
    const improvement_item_id = 'IMPROVE_001';
    const verification_start_datetime = new Date('2024-01-15T10:00:00Z');
    const verification_end_datetime = new Date('2024-01-16T10:00:00Z');
    const feedback_comment = '改善効果を確認しました';
    const recorded_by_user_id = 'USER_001';

    const result = recordImprovementEffectVerificationFeedback({
      improvement_item_id,
      verification_start_datetime,
      verification_end_datetime,
      feedback_comment,
      recorded_by_user_id,
    });

    expect(result).toEqual({
      feedback_id: expect.any(String),
      improvement_item_id: 'IMPROVE_001',
      verification_start_datetime: new Date('2024-01-15T10:00:00Z'),
      verification_end_datetime: new Date('2024-01-16T10:00:00Z'),
      verification_duration_days: 1,
      feedback_comment: '改善効果を確認しました',
      recorded_by_user_id: 'USER_001',
      recorded_datetime: expect.any(Date),
      status: 'RECORDED',
    });
  });

  test('SCEN-1157: 改善効果検証期間が1日ちょうどの場合、フィードバック記録が正常に保存される', () => {
    const improvement_item_id = 'IMPROVE_002';
    const verification_start_datetime = new Date('2024-01-15T10:00:00Z');
    const verification_end_datetime = new Date('2024-01-16T10:00:00Z');
    const feedback_comment = '1日で検証完了';
    const recorded_by_user_id = 'USER_002';

    const result = recordImprovementEffectVerificationFeedback({
      improvement_item_id,
      verification_start_datetime,
      verification_end_datetime,
      feedback_comment,
      recorded_by_user_id,
    });

    expect(result.status).toBe('RECORDED');
    expect(result.verification_duration_days).toBe(1);
  });

  test('SCEN-1157: 改善効果検証期間が複数日の場合、フィードバック記録が正常に保存される', () => {
    const improvement_item_id = 'IMPROVE_003';
    const verification_start_datetime = new Date('2024-01-15T10:00:00Z');
    const verification_end_datetime = new Date('2024-01-22T10:00:00Z');
    const feedback_comment = '7日間の検証で有意な改善を確認';
    const recorded_by_user_id = 'USER_003';

    const result = recordImprovementEffectVerificationFeedback({
      improvement_item_id,
      verification_start_datetime,
      verification_end_datetime,
      feedback_comment,
      recorded_by_user_id,
    });

    expect(result.status).toBe('RECORDED');
    expect(result.verification_duration_days).toBe(7);
  });
});
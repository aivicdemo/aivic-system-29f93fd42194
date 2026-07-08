import { assessQualityDiverenceJudgment } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1005: [edge] 相場乖離根拠データの総合判定 - 信頼度スコアがちょうど判定閾値（50%など）の場合、境界状態として管理者判断が必要と表示される
  test('信頼度スコアがちょうど50%の場合、境界状態として管理者判断が必要と表示される', () => {
    const input = {
      confidence_score: 50,
      divergence_rate: 12.5,
      reference_data_count: 8,
      correction_factor: 1.05,
      assessor_id: 'A001',
      estimate_id: 'E20240115001',
    };

    const result = assessQualityDiverenceJudgment(input);

    expect(result.judgment_status).toBe('PENDING_ADMIN_REVIEW');
    expect(result.is_boundary_state).toBe(true);
    expect(result.admin_review_required).toBe(true);
    expect(result.display_message).toMatch(/境界状態/);
    expect(result.display_message).toMatch(/管理者判断/);
    expect(result.auto_approval_executed).toBe(false);
    expect(result.auto_rejection_executed).toBe(false);
    expect(result.escalation_triggered).toBe(true);
    expect(result.log_event).toMatch(/境界値/);
  });
});
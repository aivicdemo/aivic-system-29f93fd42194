import { recordAssessorFeedback } from '../../src/logic/it-6-2-2-1';

describe('査定員フィードバック記録・学習データ優先度自動算出', () => {
  // SCEN-823
  test('修正理由が空文字列またはnullで送信された場合、記録が失敗しエラーメッセージが返される', async () => {
    // ケース1: 修正理由が空文字列
    const feedback_empty_reason = {
      assessor_id: 'ASS001',
      assessment_item_id: 'ITEM001',
      assessment_value: 85,
      improvement_proposal: '金額見積の精度向上が必要',
      correction_reason: '',
      feedback_date: '2024-01-15T11:00:00Z',
      system_judgement_result: 'APPROVED',
    };

    try {
      await recordAssessorFeedback(feedback_empty_reason);
      fail('Should have thrown an error for empty correction_reason');
    } catch (error: any) {
      expect(error.message).toMatch(/修正理由/);
      expect(error.status_code).toBe(400);
    }

    // ケース2: 修正理由がnull
    const feedback_null_reason = {
      assessor_id: 'ASS001',
      assessment_item_id: 'ITEM001',
      assessment_value: 85,
      improvement_proposal: '金額見積の精度向上が必要',
      correction_reason: null,
      feedback_date: '2024-01-15T11:00:00Z',
      system_judgement_result: 'APPROVED',
    };

    try {
      await recordAssessorFeedback(feedback_null_reason);
      fail('Should have thrown an error for null correction_reason');
    } catch (error: any) {
      expect(error.message).toMatch(/修正理由/);
      expect(error.status_code).toBe(400);
    }

    // ケース3: 修正理由が正常に入力された場合は成功する
    const feedback_valid = {
      assessor_id: 'ASS001',
      assessment_item_id: 'ITEM001',
      assessment_value: 85,
      improvement_proposal: '金額見積の精度向上が必要',
      correction_reason: '過去案件データが不足している地域での相場判定精度を改善',
      feedback_date: '2024-01-15T11:00:00Z',
      system_judgement_result: 'APPROVED',
    };

    const result = await recordAssessorFeedback(feedback_valid);

    expect(result).toBeDefined();
    expect(result.feedback_id).toBeDefined();
    expect(result.feedback_id).toMatch(/^FB_/);
    expect(result.record_status).toBe('SUCCESS');
    expect(result.learning_data_priority_score).toBeGreaterThanOrEqual(0);
    expect(result.learning_data_priority_score).toBeLessThanOrEqual(100);
    expect(result.priority_level).toMatch(/^(HIGH|MEDIUM|LOW)$/);
    expect(result.recorded_at).toBe('2024-01-15T11:00:00Z');
  });
});
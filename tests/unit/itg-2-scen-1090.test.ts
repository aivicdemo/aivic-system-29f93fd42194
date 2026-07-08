import { evaluateLearningDataNecessity } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1090
  test('学習データ偏り率が0の場合、更新不要と判定される', () => {
    const input = {
      learning_data_bias_rate: 0,
      ocr_accuracy: 92.5,
      ai_judgment_accuracy: 88.3,
      feedback_count: 5,
      data_coverage_rate: 95.0,
    };

    const result = evaluateLearningDataNecessity(input);

    expect(result.update_required).toBe(false);
    expect(result.message).toBe('学習データ更新は不要');
    expect(result.bias_rate_status).toBe('optimal');
    expect(result.priority_score).toBe(0);
  });
});
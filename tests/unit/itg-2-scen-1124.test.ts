import { detectLearningDataUpdateTrigger } from '../../src/logic/it-6-2-2-1';

describe('学習データ更新トリガー自動判定機能 - 境界値処理', () => {
  test('SCEN-1124: 物価本版数0・季節変動率0%の境界値でトリガー判定が正常に動作', () => {
    // 入力: 物価本版数=0、季節変動率=0%の境界値
    const trigger_input = {
      price_book_version: 0,
      seasonal_volatility_rate: 0,
      ocr_accuracy_previous_month: 85.0,
      ai_judgment_accuracy_previous_month: 82.5,
      user_feedback_count_current_month: 3,
      user_feedback_count_previous_month: 2
    };

    // 実行
    const result = detectLearningDataUpdateTrigger(trigger_input);

    // 期待値: 例外エラーが発生しないこと
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    // 期待値: 判定結果フィールドが存在すること
    expect(result).toHaveProperty('trigger_detected');
    expect(result).toHaveProperty('judgment_result');
    expect(result).toHaveProperty('reason');

    // 期待値: trigger_detected は boolean 値
    expect(typeof result.trigger_detected).toBe('boolean');

    // 期待値: judgment_result は明確な判定結果（'update_required' または 'update_not_required'）
    expect(['update_required', 'update_not_required']).toContain(result.judgment_result);

    // 期待値: reason フィールドが文字列で存在
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);

    // 物価本版数=0の場合、バージョン更新がないため通常はトリガーなしと判定される
    // ただし他の条件（フィードバック増加など）によっては更新必要と判定される可能性がある
    if (result.judgment_result === 'update_required') {
      // フィードバック件数が増加している場合など、他の条件が更新必要を判定
      expect(user_feedback_count_current_month > user_feedback_count_previous_month || 
             ocr_accuracy_previous_month < 80 ||
             ai_judgment_accuracy_previous_month < 80).toBe(true);
    }

    // 期待値: 季節変動率=0%は「季節変動なし」の有効な境界値として処理されている
    expect(typeof result.seasonal_consideration_applied).toBe('boolean');

    // 期待値: メタデータが記録されていること
    expect(result).toHaveProperty('input_parameters_validated');
    expect(result.input_parameters_validated).toBe(true);

    // 期待値: ゼロ値が有効な境界条件として正しく処理されていることを確認
    expect(result.boundary_conditions_handled).toBe(true);
  });
});
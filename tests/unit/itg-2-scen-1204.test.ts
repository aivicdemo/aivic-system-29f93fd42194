import { proposeMeasures } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1204
  test('改善対策立案機能 - モデルドリフトが原因の場合に再学習・パラメータ調整対策が優先度付きで立案される', () => {
    // テストデータ: モデルドリフト検出済みの精度低下ケース
    const diagnosis_result = {
      root_cause: 'model_drift',
      orc_accuracy_drop_rate: 7.5,
      ai_judgment_accuracy_drop_rate: 6.2,
      feedback_count_increase_rate: 45,
      detected_at: new Date('2024-02-15T09:00:00Z'),
    };

    // 改善対策立案機能を実行
    const proposed_measures = proposeMeasures(diagnosis_result);

    // 返却された対策リストが空でないことを確認
    expect(proposed_measures.length).toBeGreaterThan(0);

    // 対策リストの最初の要素が『再学習』または『パラメータ調整』のいずれかであることを確認
    const first_measure_type = proposed_measures[0].type;
    expect(['relearning', 'parameter_adjustment']).toContain(first_measure_type);

    // 対策リストに複数の対策が存在する場合、『再学習』と『パラメータ調整』が上位に位置することを確認
    if (proposed_measures.length > 1) {
      const relearning_index = proposed_measures.findIndex(
        (m) => m.type === 'relearning'
      );
      const parameter_adjustment_index = proposed_measures.findIndex(
        (m) => m.type === 'parameter_adjustment'
      );

      // 『再学習』と『パラメータ調整』が存在する場合、どちらか一方は最初の要素に位置
      const top_measure_type = proposed_measures[0].type;
      expect(['relearning', 'parameter_adjustment']).toContain(top_measure_type);

      // 『再学習』と『パラメータ調整』が両方存在する場合、両方とも上位 3 件以内に位置
      if (relearning_index !== -1 && parameter_adjustment_index !== -1) {
        expect(
          Math.max(relearning_index, parameter_adjustment_index)
        ).toBeLessThan(3);
      }
    }

    // 各対策に優先度（priority）属性が付与されていることを確認
    proposed_measures.forEach((measure) => {
      expect(measure).toHaveProperty('priority');
      expect(typeof measure.priority).toBe('number');
    });

    // 優先度が数値で正しく順序付けられていることを確認
    for (let i = 0; i < proposed_measures.length - 1; i++) {
      expect(proposed_measures[i].priority).toBeGreaterThanOrEqual(
        proposed_measures[i + 1].priority
      );
    }

    // モデルドリフト検出時に、『再学習』が最優先度で立案されることを確認
    const relearning_measure = proposed_measures.find(
      (m) => m.type === 'relearning'
    );
    if (relearning_measure) {
      const max_priority = Math.max(...proposed_measures.map((m) => m.priority));
      expect(relearning_measure.priority).toBe(max_priority);
    }

    // 『パラメータ調整』が『再学習』より低い優先度だが上位に位置することを確認
    const parameter_measure = proposed_measures.find(
      (m) => m.type === 'parameter_adjustment'
    );
    if (parameter_measure && relearning_measure) {
      expect(parameter_measure.priority).toBeLessThanOrEqual(
        relearning_measure.priority
      );
      expect(proposed_measures.indexOf(parameter_measure)).toBeLessThan(5);
    }

    // 各対策が必須フィールドを持つことを確認
    proposed_measures.forEach((measure) => {
      expect(measure).toHaveProperty('type');
      expect(measure).toHaveProperty('description');
      expect(measure).toHaveProperty('priority');
      expect(typeof measure.type).toBe('string');
      expect(typeof measure.description).toBe('string');
      expect(typeof measure.priority).toBe('number');
      expect(measure.priority).toBeGreaterThanOrEqual(0);
      expect(measure.priority).toBeLessThanOrEqual(100);
    });

    // 優先度スコアが他の対策より高い値で設定されていることを確認
    if (proposed_measures.length > 1) {
      const first_priority = proposed_measures[0].priority;
      const other_priorities = proposed_measures
        .slice(1)
        .map((m) => m.priority);
      const all_others_lower_or_equal = other_priorities.every(
        (p) => p <= first_priority
      );
      expect(all_others_lower_or_equal).toBe(true);
    }
  });
});
import { estimateRequiredTrainingDataCount } from '../../src/logic/it-1-br-6-2-1';

describe('他部署適用時の追加学習データ量見積機能', () => {
  // SCEN-1379
  test('精度低下度が0%の場合、必要学習データ件数が0と判定される', () => {
    const accuracy_drop_rate = 0;
    const base_training_data_count = 1000;
    const result = estimateRequiredTrainingDataCount({
      accuracy_drop_rate,
      base_training_data_count,
    });

    expect(result.required_training_data_count).toBe(0);
    expect(result.learning_period_days).toBe(0);
    expect(result.estimated_cost_yen).toBe(0);
    expect(result.is_feasible).toBe(true);
  });

  // 正常系：精度低下度が5%の場合、必要学習データ件数が計算される
  test('精度低下度が5%の場合、必要学習データ件数が正しく計算される', () => {
    const accuracy_drop_rate = 5;
    const base_training_data_count = 1000;
    const result = estimateRequiredTrainingDataCount({
      accuracy_drop_rate,
      base_training_data_count,
    });

    expect(result.required_training_data_count).toBe(500);
    expect(result.learning_period_days).toBe(10);
    expect(result.estimated_cost_yen).toBe(250000);
    expect(result.is_feasible).toBe(true);
  });

  // 正常系：精度低下度が50%の場合、必要学習データ件数が大量に計算される
  test('精度低下度が50%の場合、必要学習データ件数が大量に計算される', () => {
    const accuracy_drop_rate = 50;
    const base_training_data_count = 1000;
    const result = estimateRequiredTrainingDataCount({
      accuracy_drop_rate,
      base_training_data_count,
    });

    expect(result.required_training_data_count).toBe(5000);
    expect(result.learning_period_days).toBe(100);
    expect(result.estimated_cost_yen).toBe(2500000);
    expect(result.is_feasible).toBe(false);
  });

  // エラー系：精度低下度がマイナス値の場合、エラーを投げる
  test('精度低下度がマイナス値の場合、エラーを投げる', () => {
    expect(() =>
      estimateRequiredTrainingDataCount({
        accuracy_drop_rate: -5,
        base_training_data_count: 1000,
      })
    ).toThrow(/精度低下度/);
  });

  // エラー系：精度低下度が100%を超える場合、エラーを投げる
  test('精度低下度が100%を超える場合、エラーを投げる', () => {
    expect(() =>
      estimateRequiredTrainingDataCount({
        accuracy_drop_rate: 101,
        base_training_data_count: 1000,
      })
    ).toThrow(/精度低下度/);
  });

  // エラー系：基本学習データ件数が0以下の場合、エラーを投げる
  test('基本学習データ件数が0以下の場合、エラーを投げる', () => {
    expect(() =>
      estimateRequiredTrainingDataCount({
        accuracy_drop_rate: 5,
        base_training_data_count: 0,
      })
    ).toThrow(/基本学習データ件数/);
  });
});
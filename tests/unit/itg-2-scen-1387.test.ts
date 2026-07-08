import { calculatePrecisionDeviationAllowance } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1387: 精度低下許容範囲判定機能 - 基準精度データが存在しない場合、エラーが返される', () => {
    // 基準精度データが登録されていない状態を再現
    const baseline_precision_data = null;
    const current_precision = 75.5;
    const threshold_percentage = 5;

    // 精度低下許容範囲の判定処理を実行
    expect(() =>
      calculatePrecisionDeviationAllowance({
        baseline_precision_data,
        current_precision,
        threshold_percentage,
      })
    ).toThrow(/基準精度データ/);
  });
});
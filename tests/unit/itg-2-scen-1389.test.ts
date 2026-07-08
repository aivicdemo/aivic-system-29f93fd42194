import { calculateAccuracyWithinToleranceRange } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1389: 精度低下許容範囲判定機能 - 許容範囲の上限値ちょうどの場合、許容範囲内と判定される', () => {
    // 許容範囲: 下限値 70%, 上限値 100%
    const tolerance_lower_bound = 70;
    const tolerance_upper_bound = 100;
    
    // テスト対象: 精度値が許容範囲の上限値と同じ値 (100%)
    const accuracy_value = 100;
    
    // 判定処理を実行
    const result = calculateAccuracyWithinToleranceRange({
      accuracy_percentage: accuracy_value,
      lower_limit: tolerance_lower_bound,
      upper_limit: tolerance_upper_bound,
    });
    
    // 期待結果: 許容範囲内と判定される
    expect(result.is_within_tolerance).toBe(true);
    expect(result.judgment_status).toBe('許容範囲内');
  });
});
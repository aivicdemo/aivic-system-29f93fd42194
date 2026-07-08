import { calculateDeviationAllowanceRange } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-993: [error] 乖離許容範囲の自動判定 - 乖離額の計算にNULL値が含まれる場合、計算エラーが返される
  test('乖離額計算にNULL値が含まれる場合、計算エラーが返される', () => {
    const input = {
      assessed_amount: null,
      standard_amount: 1000000,
      region: '東京',
      construction_type: '鉄骨造',
    };

    expect(() => calculateDeviationAllowanceRange(input)).toThrow(/NULL値/);
  });
});
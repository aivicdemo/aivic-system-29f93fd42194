import { describe, it, expect, beforeEach } from '@jest/globals';
import { judgeToleranceRange } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1385
  it('精度低下許容範囲判定機能 - 他部署精度が基準精度より5%低い場合、許容範囲内と判定される', () => {
    const base_accuracy_pct = 80;
    const other_dept_accuracy_pct = 75;
    const tolerance_threshold_pct = 5;

    const result = judgeToleranceRange({
      base_accuracy: base_accuracy_pct,
      other_dept_accuracy: other_dept_accuracy_pct,
      tolerance_threshold: tolerance_threshold_pct,
    });

    expect(result).toEqual({
      is_within_tolerance: true,
      accuracy_diff_pct: 5,
      judgment: '許容範囲内',
      base_accuracy: 80,
      other_dept_accuracy: 75,
    });
  });
});
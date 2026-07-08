import { calculateDeviationRateAndModificationRequired } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-976: 月次実績と配置計画の乖離判定・修正要否自動判定 - 実績値と計画値が同一の場合、乖離率0%として修正不要と判定される', () => {
    // セットアップ: 月次実績値と配置計画値が同一（100）
    const actual_count = 100;
    const planned_count = 100;

    // ロジック実行
    const result = calculateDeviationRateAndModificationRequired({
      actual_count,
      planned_count,
    });

    // 期待結果: 乖離率0%、修正不要フラグfalse
    expect(result.deviation_rate_percent).toBe(0);
    expect(result.modification_required).toBe(false);
  });
});
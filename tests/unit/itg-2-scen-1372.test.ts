import { calculatePrecisionDeclineRate } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1372: [edge] 精度低下度定量化機能 - 精度低下率が0%と許容閾値の境界値で乖離度の符号が正確に判定される
  test('精度低下率が0%と許容閾値の境界値で乖離度の符号が正確に判定される', () => {
    const tolerance_threshold = 5; // 許容閾値: 5%

    // ケース1: 精度低下率が0%の場合
    const case1_decline_rate = 0;
    const result1 = calculatePrecisionDeclineRate({
      previous_precision: 85,
      current_precision: 85,
      tolerance_threshold,
    });
    // 低下率0% = 許容閾値(5%)内 → 符号は0（正常範囲）
    expect(result1.decline_rate_percentage).toBe(0);
    expect(result1.deviation_sign).toBe(0);
    expect(result1.within_tolerance).toBe(true);

    // ケース2: 精度低下率が許容閾値と同じ値(5%)の場合
    const case2_decline_rate = 5;
    const result2 = calculatePrecisionDeclineRate({
      previous_precision: 85,
      current_precision: 80,
      tolerance_threshold,
    });
    // 低下率5% = 許容閾値(5%)と同値 → 符号は0（正常範囲の上限）
    expect(result2.decline_rate_percentage).toBe(5);
    expect(result2.deviation_sign).toBe(0);
    expect(result2.within_tolerance).toBe(true);

    // ケース3: 精度低下率が許容閾値より低い値(4.9%)の場合
    const case3_decline_rate = 4.9;
    const result3 = calculatePrecisionDeclineRate({
      previous_precision: 85,
      current_precision: 80.085,
      tolerance_threshold,
    });
    // 低下率4.9% < 許容閾値(5%) → 符号は0（正常範囲）
    expect(result3.decline_rate_percentage).toBeCloseTo(4.9, 1);
    expect(result3.deviation_sign).toBe(0);
    expect(result3.within_tolerance).toBe(true);

    // ケース4: 精度低下率が許容閾値より高い値(5.1%)の場合
    const case4_decline_rate = 5.1;
    const result4 = calculatePrecisionDeclineRate({
      previous_precision: 85,
      current_precision: 79.9835,
      tolerance_threshold,
    });
    // 低下率5.1% > 許容閾値(5%) → 符号は-1（不正常、低下超過）
    expect(result4.decline_rate_percentage).toBeCloseTo(5.1, 1);
    expect(result4.deviation_sign).toBe(-1);
    expect(result4.within_tolerance).toBe(false);

    // 全ケースを統合検証: 境界値の符号判定一貫性確認
    const boundary_test_results = [result1, result2, result3, result4];
    
    // 正常範囲(許容閾値以内)のケースは符号が0
    expect(result1.deviation_sign).toBe(0);
    expect(result2.deviation_sign).toBe(0);
    expect(result3.deviation_sign).toBe(0);
    
    // 不正常(許容閾値超過)のケースは符号が-1
    expect(result4.deviation_sign).toBe(-1);
    
    // 許容閾値の厳密な境界判定
    expect(result2.within_tolerance).toBe(true); // 5.0% = 許容閾値
    expect(result4.within_tolerance).toBe(false); // 5.1% > 許容閾値
  });
});
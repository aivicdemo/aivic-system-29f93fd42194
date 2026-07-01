import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('顧客ごと・サービスごとの請求額計算機能 - 複数割引の適用順序検証', () => {
  test('SCEN-1294: 複数割引が同時に適用される場合、計算順序により異なる結果が生じないことが検証される', () => {
    // テストデータ準備：基本料金10,000円、割引A：10%、割引B：5%、割引C：2%
    const baseBillingAmount = 10000;
    const discountA = 0.10;
    const discountB = 0.05;
    const discountC = 0.02;

    // パターン1：割引適用順序 A→B→C
    // 計算: 10000 * (1 - 0.10) = 9000
    //       9000 * (1 - 0.05) = 8550
    //       8550 * (1 - 0.02) = 8379
    const result_pattern_1_abc = calculateBillingAmount({
      baseAmount: baseBillingAmount,
      discounts: [discountA, discountB, discountC],
    });
    expect(result_pattern_1_abc).toBe(8379);

    // パターン2：割引適用順序 C→B→A
    // 計算: 10000 * (1 - 0.02) = 9800
    //       9800 * (1 - 0.05) = 9310
    //       9310 * (1 - 0.10) = 8379
    const result_pattern_2_cba = calculateBillingAmount({
      baseAmount: baseBillingAmount,
      discounts: [discountC, discountB, discountA],
    });
    expect(result_pattern_2_cba).toBe(8379);

    // パターン3：割引適用順序 B→A→C
    // 計算: 10000 * (1 - 0.05) = 9500
    //       9500 * (1 - 0.10) = 8550
    //       8550 * (1 - 0.02) = 8379
    const result_pattern_3_bac = calculateBillingAmount({
      baseAmount: baseBillingAmount,
      discounts: [discountB, discountA, discountC],
    });
    expect(result_pattern_3_bac).toBe(8379);

    // パターン1, パターン2, パターン3の結果が完全に一致することを確認
    expect(result_pattern_1_abc).toEqual(result_pattern_2_cba);
    expect(result_pattern_2_cba).toEqual(result_pattern_3_bac);

    // テストパターン：異なる割引組み合わせパターン1
    // 基本料金5,000円、割引A：15%、割引B：8%、割引C：3%
    const baseAmount_pattern_4 = 5000;
    const discountA_p4 = 0.15;
    const discountB_p4 = 0.08;
    const discountC_p4 = 0.03;

    // 順序A→B→C: 5000 * 0.85 * 0.92 * 0.97 = 3808.45 → 3808
    const result_p4_abc = calculateBillingAmount({
      baseAmount: baseAmount_pattern_4,
      discounts: [discountA_p4, discountB_p4, discountC_p4],
    });
    expect(result_p4_abc).toBe(3808);

    // 順序C→A→B: 5000 * 0.97 * 0.85 * 0.92 = 3808.45 → 3808
    const result_p4_cab = calculateBillingAmount({
      baseAmount: baseAmount_pattern_4,
      discounts: [discountC_p4, discountA_p4, discountB_p4],
    });
    expect(result_p4_cab).toBe(3808);

    // 順序B→C→A: 5000 * 0.92 * 0.97 * 0.85 = 3808.45 → 3808
    const result_p4_bca = calculateBillingAmount({
      baseAmount: baseAmount_pattern_4,
      discounts: [discountB_p4, discountC_p4, discountA_p4],
    });
    expect(result_p4_bca).toBe(3808);

    // パターン4の計算結果が完全に一致することを確認
    expect(result_p4_abc).toEqual(result_p4_cab);
    expect(result_p4_cab).toEqual(result_p4_bca);

    // テストパターン：異なる割引組み合わせパターン2
    // 基本料金20,000円、割引A：20%、割引B：12%、割引C：7%
    const baseAmount_pattern_5 = 20000;
    const discountA_p5 = 0.20;
    const discountB_p5 = 0.12;
    const discountC_p5 = 0.07;

    // 順序A→B→C: 20000 * 0.80 * 0.88 * 0.93 = 13132.8 → 13133
    const result_p5_abc = calculateBillingAmount({
      baseAmount: baseAmount_pattern_5,
      discounts: [discountA_p5, discountB_p5, discountC_p5],
    });
    expect(result_p5_abc).toBe(13133);

    // 順序B→C→A: 20000 * 0.88 * 0.93 * 0.80 = 13132.8 → 13133
    const result_p5_bca = calculateBillingAmount({
      baseAmount: baseAmount_pattern_5,
      discounts: [discountB_p5, discountC_p5, discountA_p5],
    });
    expect(result_p5_bca).toBe(13133);

    // 順序C→A→B: 20000 * 0.93 * 0.80 * 0.88 = 13132.8 → 13133
    const result_p5_cab = calculateBillingAmount({
      baseAmount: baseAmount_pattern_5,
      discounts: [discountC_p5, discountA_p5, discountB_p5],
    });
    expect(result_p5_cab).toBe(13133);

    // パターン5の計算結果が完全に一致することを確認
    expect(result_p5_abc).toEqual(result_p5_bca);
    expect(result_p5_bca).toEqual(result_p5_cab);

    // エッジケース：割引率が99%に近い場合
    // 基本料金1,000円、割引A：99%、割引B：0.5%
    const baseAmount_edge = 1000;
    const discountA_edge = 0.99;
    const discountB_edge = 0.005;

    // 順序A→B: 1000 * 0.01 * 0.995 = 9.95 → 10
    const result_edge_ab = calculateBillingAmount({
      baseAmount: baseAmount_edge,
      discounts: [discountA_edge, discountB_edge],
    });
    expect(result_edge_ab).toBe(10);

    // 順序B→A: 1000 * 0.995 * 0.01 = 9.95 → 10
    const result_edge_ba = calculateBillingAmount({
      baseAmount: baseAmount_edge,
      discounts: [discountB_edge, discountA_edge],
    });
    expect(result_edge_ba).toBe(10);

    // エッジケースの計算結果が完全に一致することを確認
    expect(result_edge_ab).toEqual(result_edge_ba);

    // 複数割引組み合わせの丸め誤差が許容範囲内（±1円以内）であることを確認
    // パターン1との比較
    expect(Math.abs(result_pattern_1_abc - result_pattern_2_cba)).toBeLessThanOrEqual(1);
    expect(Math.abs(result_pattern_2_cba - result_pattern_3_bac)).toBeLessThanOrEqual(1);
    expect(Math.abs(result_pattern_3_bac - result_pattern_1_abc)).toBeLessThanOrEqual(1);

    // パターン4との比較
    expect(Math.abs(result_p4_abc - result_p4_cab)).toBeLessThanOrEqual(1);
    expect(Math.abs(result_p4_cab - result_p4_bca)).toBeLessThanOrEqual(1);
    expect(Math.abs(result_p4_bca - result_p4_abc)).toBeLessThanOrEqual(1);

    // パターン5との比較
    expect(Math.abs(result_p5_abc - result_p5_bca)).toBeLessThanOrEqual(1);
    expect(Math.abs(result_p5_bca - result_p5_cab)).toBeLessThanOrEqual(1);
    expect(Math.abs(result_p5_cab - result_p5_abc)).toBeLessThanOrEqual(1);

    // エッジケースの丸め誤差が許容範囲内であることを確認
    expect(Math.abs(result_edge_ab - result_edge_ba)).toBeLessThanOrEqual(1);
  });
});
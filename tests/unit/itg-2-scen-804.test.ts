import { calculateDeviationRate } from '../../src/logic/it-6-3-1';

describe('見積項目相場乖離自動算出機能', () => {
  // SCEN-804
  test('乖離率がマイナス値（過小見積）とプラス値（過大見積）の両方で正しく計算される', () => {
    const market_price = 10000;

    // ケース1: 過小見積（見積価格8,000円）
    const underestimate_quote_price = 8000;
    const underestimate_deviation_rate = calculateDeviationRate({
      market_price,
      quote_price: underestimate_quote_price,
    });
    expect(underestimate_deviation_rate).toBe(-20.0);

    // ケース2: 過大見積（見積価格12,000円）
    const overestimate_quote_price = 12000;
    const overestimate_deviation_rate = calculateDeviationRate({
      market_price,
      quote_price: overestimate_quote_price,
    });
    expect(overestimate_deviation_rate).toBe(20.0);

    // マイナス値とプラス値の両方が正確に計算されていることを確認
    expect(underestimate_deviation_rate).toBeLessThan(0);
    expect(overestimate_deviation_rate).toBeGreaterThan(0);
    expect(Math.abs(underestimate_deviation_rate)).toBe(
      Math.abs(overestimate_deviation_rate)
    );
  });
});
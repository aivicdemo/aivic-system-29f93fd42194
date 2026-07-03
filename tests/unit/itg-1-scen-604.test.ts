import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-604: 割引率が 0% または 100% の境界値で請求額が正確に計算される', () => {
    // 割引率 0% のケース（割引なし）
    const result_no_discount = calculateBillingAmount({
      base_amount: 10000,
      discount_rate: 0,
    });
    expect(result_no_discount).toBe(10000);

    // 割引率 100% のケース（全額割引）
    const result_full_discount = calculateBillingAmount({
      base_amount: 10000,
      discount_rate: 100,
    });
    expect(result_full_discount).toBe(0);

    // 50% 割引のケース（中間値）
    const result_half_discount = calculateBillingAmount({
      base_amount: 10000,
      discount_rate: 50,
    });
    expect(result_half_discount).toBe(5000);

    // 33.33% 割引のケース（小数点以下を含む）
    const result_decimal_discount = calculateBillingAmount({
      base_amount: 10000,
      discount_rate: 33.33,
    });
    expect(result_decimal_discount).toBe(6667);

    // 複数の商品金額での検証（0円のベース金額）
    const result_zero_base = calculateBillingAmount({
      base_amount: 0,
      discount_rate: 50,
    });
    expect(result_zero_base).toBe(0);

    // 複数の商品金額での検証（高額の場合）
    const result_high_amount = calculateBillingAmount({
      base_amount: 100000,
      discount_rate: 0,
    });
    expect(result_high_amount).toBe(100000);

    // 複数の商品金額での検証（高額で100%割引）
    const result_high_amount_full_discount = calculateBillingAmount({
      base_amount: 100000,
      discount_rate: 100,
    });
    expect(result_high_amount_full_discount).toBe(0);
  });
});
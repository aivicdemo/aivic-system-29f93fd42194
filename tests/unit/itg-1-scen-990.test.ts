import { validateBillingAmountDifference } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求内容の再計算・修正判定 - 修正前後の請求額差分がゼロ円の境界値", () => {
  test("SCEN-990: 差分0円、0.01円、-0.01円の境界値で修正判定が正確に実行される", () => {
    // ケース1: 差分がゼロ円 - 修正不要
    const result_zero_diff = validateBillingAmountDifference({
      pre_billing_amount: 100000,
      post_billing_amount: 100000,
    });
    expect(result_zero_diff).toEqual({
      is_modification_required: false,
      difference_amount: 0,
      difference_type: "zero",
    });

    // ケース2: 差分が0.01円（正の方向）- 修正必要
    const result_pos_diff = validateBillingAmountDifference({
      pre_billing_amount: 100000,
      post_billing_amount: 100000.01,
    });
    expect(result_pos_diff).toEqual({
      is_modification_required: true,
      difference_amount: 0.01,
      difference_type: "positive",
    });

    // ケース3: 差分が-0.01円（負の方向）- 修正必要
    const result_neg_diff = validateBillingAmountDifference({
      pre_billing_amount: 100000,
      post_billing_amount: 99999.99,
    });
    expect(result_neg_diff).toEqual({
      is_modification_required: true,
      difference_amount: -0.01,
      difference_type: "negative",
    });

    // ケース4: 差分が大きい正の値 - 修正必要
    const result_large_pos = validateBillingAmountDifference({
      pre_billing_amount: 100000,
      post_billing_amount: 105000,
    });
    expect(result_large_pos).toEqual({
      is_modification_required: true,
      difference_amount: 5000,
      difference_type: "positive",
    });

    // ケース5: 差分が大きい負の値 - 修正必要
    const result_large_neg = validateBillingAmountDifference({
      pre_billing_amount: 100000,
      post_billing_amount: 95000,
    });
    expect(result_large_neg).toEqual({
      is_modification_required: true,
      difference_amount: -5000,
      difference_type: "negative",
    });

    // ケース6: 修正前後の請求額が0円の場合 - 修正不要
    const result_zero_amount = validateBillingAmountDifference({
      pre_billing_amount: 0,
      post_billing_amount: 0,
    });
    expect(result_zero_amount).toEqual({
      is_modification_required: false,
      difference_amount: 0,
      difference_type: "zero",
    });

    // ケース7: 浮動小数点誤差の許容範囲外（差分0.001円）- 修正必要
    const result_micro_diff = validateBillingAmountDifference({
      pre_billing_amount: 100000,
      post_billing_amount: 100000.001,
    });
    expect(result_micro_diff).toEqual({
      is_modification_required: true,
      difference_amount: 0.001,
      difference_type: "positive",
    });
  });

  test("SCEN-990: 無効な入力値でエラーが適切に発生する", () => {
    // 負の請求額の入力値
    expect(() =>
      validateBillingAmountDifference({
        pre_billing_amount: -100000,
        post_billing_amount: 100000,
      })
    ).toThrow(/請求額/);

    // NaNが含まれる場合
    expect(() =>
      validateBillingAmountDifference({
        pre_billing_amount: NaN,
        post_billing_amount: 100000,
      })
    ).toThrow(/請求額/);

    // nullが含まれる場合
    expect(() =>
      validateBillingAmountDifference({
        pre_billing_amount: null as any,
        post_billing_amount: 100000,
      })
    ).toThrow(/請求額/);

    // undefinedが含まれる場合
    expect(() =>
      validateBillingAmountDifference({
        pre_billing_amount: undefined as any,
        post_billing_amount: 100000,
      })
    ).toThrow(/請求額/);
  });
});